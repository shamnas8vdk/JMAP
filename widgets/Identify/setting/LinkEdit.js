/*global define*/
/*jshint maxlen: 250*/
define(
  ['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  'dojo/Deferred',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'dijit/Tooltip',
  'dojo/text!./LinkEdit.html',
  'esri/request',
  './LayerFieldChooser',
  './AddFieldBtn',
  'dijit/form/TextBox',
  'jimu/dijit/CheckBox',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin'
  ],
  function(declare,lang,array,html,on,Deferred,_WidgetsInTemplateMixin,BaseWidgetSetting,
  Tooltip,template,esriRequest, LayerFieldChooser, AddFieldBtn) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'link-edit',
      templateString: template,
      nls:null,
      config:null,
      searchSetting:null,
      layerInfoCache:null,
      _layerInfo:null,
      layerURL:null,
      tr: null,

      postCreate: function() {
        this.inherited(arguments);
        this.linkContentAddButton = new AddFieldBtn({}, this.linkContentAddButtonDiv);
        this.linkIconContentAddButton = new AddFieldBtn({}, this.linkIconContentAddButtonDiv);
        this.linkAliasAddButton = new AddFieldBtn({},this.linkAliasAddButtonDiv);
        this._bindEvents();
        this.setConfig(this.config);
        this.getLayerInfo();
      },

      getLayerInfo:function(){
        this._layerInfo = this.layerInfoCache[this.layerURL];
        if (!this._layerInfo){
          var def = this._requestLayerInfo(this.layerURL);
          return def;
        } else{
          if(this._layerInfo.fields){
            var fields = array.filter(this._layerInfo.fields,function(item){
              return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeBlob' && item.type !== 'esriFieldTypeGeometry' &&
              item.type !== 'esriFieldTypeRaster' && item.type !== 'esriFieldTypeGUID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeXML';
            });
            if(fields.length > 0){
              this._initFieldsAdds(fields);
            }
          }
        }
      },

      _initFieldsAdds:function(fieldInfos){
        var data = array.map(fieldInfos,lang.hitch(this,function(fieldInfo,index){
          var item = lang.mixin({},fieldInfo);
          item.id = index;
          item.key = '{' + item.alias + '}';
          item.label = item.alias + ' {' + item.name + '}';
          return item;
        }));

        if(data.length > 0){
          this.linkContentAddButton.items = data;
          this.linkIconContentAddButton.items = data;
          this.linkAliasAddButton.items = data;
        }
      },

      _requestLayerInfo:function(url){
        if(!url){
          return;
        }
        esriRequest.setRequestPreCallback(function (ioArgs) {
          ioArgs.failOk = true;
          return ioArgs;
        });

        var def = new Deferred();
        if(this._def && !this._def.isFulfilled()){
          this._def.cancel('new layer info was requested');
        }
        this._def = esriRequest({
          url:url,
          content:{f: 'json'},
          handleAs: 'json',
          callbackParamName: 'callback',
          timeout:20000
        },{
          useProxy:false
        });
        this._def.then(lang.hitch(this,function(response){
          this._layerInfo = response;
          this.layerInfoCache[this.layerURL] = this._layerInfo;
          if(response && response.fields){
            var fields = array.filter(response.fields,function(item){
              return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeBlob' && item.type !== 'esriFieldTypeGeometry' &&
              item.type !== 'esriFieldTypeRaster' && item.type !== 'esriFieldTypeGUID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeXML';
            });
            if(fields.length > 0){
              this._initFieldsAdds(fields);
            }
          }
        }),lang.hitch(this,function(error){
          if (error.message !== 'Request canceled'){
            console.error('request layer info failed' ,error);
          }
          this._layerInfo = null;
        }));
        esriRequest.setRequestPreCallback();
        return def;
      },

      _bindEvents:function(){
        this.own(on(this.linkContentAddButton, 'onMenuClick', lang.hitch(this,function(item){
          this._insertAtCursor(this.linkContentTA, item.key);
        })));
        this.own(on(this.linkIconContentAddButton, 'onMenuClick', lang.hitch(this,function(item){
          this._insertAtCursor(this.linkIconContentTA, item.key);
        })));
        this.own(on(this.linkAliasAddButton, 'onMenuClick', lang.hitch(this,function(item){
          this._insertAtCursor(this.linkAlias, item.key);
        })));
      },

      setConfig:function(config){
        this.config = config;
//        console.info(config);
        this.resetAll();
        if(!this.config){
          return;
        }
//        this.linkAlias.set('value', lang.trim(this.config.alias || ''));
        this.linkAlias.value = lang.trim(this.config.alias || '');
        this.disableNullLinkCbx.setValue(this.config.disablelinksifnull || true);
        this.disableLinkinPopUpCbx.setValue(this.config.disableinpopup || false);
        this.selectLinkType.set('value', this.config.popuptype || 'image');
        this.linkContentTA.value = this.config.content || '';
        this.linkIconContentTA.value = this.config.icon || '';
      },

      getConfig:function(){
        if(!this.validate(false)){
          return [false, this.tr];
        }
        var config = {
          /*alias:lang.trim(this.linkAlias.get('value')),*/
          alias:lang.trim(this.linkAlias.value),
          disablelinksifnull: this.disableNullLinkCbx.getValue(),
          disableinpopup: this.disableLinkinPopUpCbx.getValue(),
          popuptype: this.selectLinkType.get('value'),
          content: lang.trim(this.linkContentTA.value),
          icon: lang.trim(this.linkIconContentTA.value)
        };
        this.config = config;
        return [this.config, this.tr];
      },

      resetAll:function(){
        //this.linkAlias.set('value', '');
        this.linkAlias.value = '';
      },

      _insertAtCursor:function(myField, myValue) {
        var sel;
        //IE support
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
        }
        //MOZILLA and others
        else if (myField.selectionStart || myField.selectionStart === 0) {
          var startPos = myField.selectionStart;
          var endPos = myField.selectionEnd;
          myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
          myField.selectionStart = startPos + myValue.length;
          myField.selectionEnd = startPos + myValue.length;
        } else {
          myField.value += myValue;
        }
      },

      validate:function(showTooltip){
        /*if(lang.trim(this.linkAlias.get('value')) === ''){
          if(showTooltip){
            this._showTooltip(this.linkAlias.domNode, 'Please input value.');
          }
          return false;
        }*/
        if(lang.trim(this.linkAlias.value) === ''){
          if(showTooltip){
            this._showTooltip(this.linkAlias.domNode, 'Please input value.');
          }
          return false;
        }
        if(lang.trim(this.linkContentTA.value) === ''){
          if(showTooltip){
            this._showTooltip(this.linkContentTA, 'Please input value.');
          }
          return false;
        }
        return true;
      },

      _showTooltip:function(aroundNode, content, time){
        this._scrollToDom(aroundNode);
        Tooltip.show(content,aroundNode);
        time = time ? time : 2000;
        setTimeout(function(){
          Tooltip.hide(aroundNode);
        },time);
      },

      _scrollToDom:function(dom){
        var scrollDom = this.searchSetting.domNode.parentNode;
        var y1 = html.position(scrollDom).y;
        var y2 = html.position(dom).y;
        scrollDom.scrollTop = y2 - y1;
      }

    });
  });
