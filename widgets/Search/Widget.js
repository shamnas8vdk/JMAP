///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/when',
    'dojo/on',
    'dojo/aspect',
    'dojo/query',
    'dojo/keys',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dijit/form/CheckBox',
    './filterConfig',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'dojo/_base/array',
    'jimu/BaseWidget',
    'jimu/WidgetManager',
    'jimu/PanelManager',
    'jimu/LayerInfos/LayerInfos',
    'jimu/utils',
    'jimu/SpatialReference/wkidUtils',
    'esri/config',
    'esri/dijit/Search',
    'esri/tasks/locator',
    'esri/layers/FeatureLayer',
    'esri/dijit/PopupTemplate',
    'esri/lang',
    'esri/geometry/Point',
    'esri/geometry/Extent',
    'esri/geometry/coordinateFormatter',
    'esri/graphic',
    'esri/SpatialReference',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/Color',
    "esri/geometry/screenUtils",
    'esri/tasks/query',
    './utils',
    'dojo/NodeList-dom'
  ],
  function(declare, lang, array, html, when, on, aspect, query, keys, Deferred, all, domConstruct, domStyle, 
    CheckBox, filterConfig, ArcGISDynamicMapServiceLayer, arrayUtils,
    BaseWidget, WidgetManager, PanelManager, LayerInfos, jimuUtils, wkidUtils, esriConfig, Search, Locator,
    FeatureLayer, PopupTemplate, esriLang, Point, Extent, coordinateFormatter, Graphic, SpatialReference, 
    SimpleLineSymbol, SimpleFillSymbol, Color, screenUtils, FeatureQuery, utils) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      name: 'Search',
      baseClass: 'jimu-widget-search',
      searchDijit: null,
      searchResults: null,
      _startWidth: null,
      _pointOfSpecifiedUtmCache: null,
      wManager: null,
      pManager: null,
      sourceIndex: null,
      filterBoxes : new Object(),
      filterContainer: null,
      checkBtn: null,

      postCreate: function() {
        if (this.closeable || !this.isOnScreen) {
          html.addClass(this.searchNode, 'default-width-for-openAtStart');
        }

        this.listenWidgetIds.push('framework');
        this._pointOfSpecifiedUtmCache = {};
      },

      startup: function() {
        this.inherited(arguments);
        this.wManager = WidgetManager.getInstance();
        this.pManager = PanelManager.getInstance();
        if (!(this.config && this.config.sources)) {
          this.config.sources = [];
        }

        coordinateFormatter.load();
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(layerInfosObj) {
            this.layerInfosObj = layerInfosObj;
            this.own(this.layerInfosObj.on(
            'layerInfosFilterChanged',
            lang.hitch(this, this.onLayerInfosFilterChanged)));

            utils.setMap(this.map);
            utils.setLayerInfosObj(this.layerInfosObj);
            utils.setAppConfig(this.appConfig);
            when(utils.getConfigInfo(this.config)).then(lang.hitch(this, function(config) {
              return all(this._convertConfig(config)).then(function(searchSouces) {
                return array.filter(searchSouces, function(source) {
                  return source;
                });
              });
            })).then(lang.hitch(this, function(searchSouces) {
              if (!this.domNode) {
                return;
              }

              this.searchDijit = new Search({
                activeSourceIndex: searchSouces.length === 1 ? 0 : 'all',
                allPlaceholder: jimuUtils.stripHTML(esriLang.isDefined(this.config.allPlaceholder) ?
                  this.config.allPlaceholder : ""),
                autoSelect: true,
                enableButtonMode: false,
                enableLabel: false,
                enableHighlight: true,
                enableInfoWindow: true,
                showInfoWindowOnSelect: true,
                map: this.map,
                sources: this.getSources(),//searchSouces,
                theme: 'arcgisSearch'
              });
              html.place(this.searchDijit.domNode, this.searchNode);
              // this.generateFilterDropdown();
              this.searchDijit.startup();

              this._resetSearchDijitStyle();

              this.own(
                this.searchDijit.watch(
                  'activeSourceIndex',
                  lang.hitch(this, '_onSourceIndexChange')
                )
              );

              this.own(
                on(this.searchDijit.domNode, 'click', lang.hitch(this, '_onSearchDijitClick'))
              );
              this.own(on(this.searchDijit.inputNode, "keyup", lang.hitch(this, function(e) {
                if (e.keyCode !== keys.ENTER) {
                  this._onClearSearch();
                }
              })));

              /*
              this.own(
                aspect.before(this.searchDijit, 'select', lang.hitch(this, '_captureSelect'))
                );
              */

              this.own(
                on(this.searchDijit, 'search-results', lang.hitch(this, '_onSearchResults'))
              );

              this.own(
                on(this.searchDijit, 'suggest-results', lang.hitch(this, '_onSuggestResults'))
              );

              this.own(
                on(this.searchDijit, 'select-result', lang.hitch(this, '_onSelectResult'))
              );

              this.own(
                on(this.searchResultsNode, 'li:click', lang.hitch(this, '_onSelectSearchResult'))
              );

              this.own(on(
                this.searchResultsNode,
                '.show-all-results:click',
                lang.hitch(this, '_showResultMenu')
              ));

              this.own(
                on(window.document, 'click', lang.hitch(this, function(e) {
                  if (!html.isDescendant(e.target, this.searchResultsNode)) {
                    this._hideResultMenu();
                    this._resetSelectorPosition('.show-all-results');
                  }
                }))
              );

              this.own(
                on(this.searchDijit, 'clear-search', lang.hitch(this, '_onClearSearch'))
              );

              this.own(
                aspect.around(this.searchDijit, '_search', lang.hitch(this, '_convertSR'))
              );
              /*
              this.own(
                aspect.after(this.map.infoWindow, 'show', lang.hitch(this, function() {
                  if (this.searchDijit &&
                    this.map.infoWindow.getSelectedFeature() !==
                    this.searchDijit.highlightGraphic) {
                    this.searchDijit.clearGraphics();
                    query('li', this.searchResultsNode).removeClass('result-item-selected');
                  }
                }))
              );
              this.own(
                on(this.map.infoWindow, 'show,hide', lang.hitch(this, function() {
                  if (this.searchDijit &&
                    this.map.infoWindow.getSelectedFeature() ===
                    this.searchDijit.highlightGraphic) {
                    this.searchDijit.clearGraphics();
                    query('li', this.searchResultsNode).removeClass('result-item-selected');
                  }
                }))
              );
              */

              this.fetchData('framework');
              this.generateFilterDropdown();
            }));
          }));
      },

      generateFilterDropdown: function(){
        // Add feature layers as new source 
        // this.addConfigSearchSource();

        // Create reference to this widget
        var current = this;
        query(".searchGroup", this.searchNode).forEach(function(node){
          // Create button to toggle filter
          current.checkBtn = domConstruct.create("div", { innerHTML: "🔧", role:"button", class:"searchBtn searchSubmit searchBoxContainerButton" }, node);
          current.filterContainer = domConstruct.create("div", { id: "searchBoxContainer", class:"filterBoxContainer" }, node);
          domStyle.set(current.checkBtn, "display", "none");
          domStyle.set(current.filterContainer, "display", "none");

          // Set Container to appear on click
          on(current.checkBtn, 'click', function(evt){
            if(current.filterContainer.style.display == "none") {
              domStyle.set(current.filterContainer, "display", "block");
            }
            else
              domStyle.set(current.filterContainer, "display", "none");
          });

          arrayUtils.forEach(getQueryLayers(), function(Layer) { 
            var sourceFilters = domConstruct.create("div", null, current.filterContainer);
            domStyle.set(sourceFilters, "display", "none");
            current.filterBoxes[Layer.URL]["container"] = sourceFilters;
            current.filterBoxes[Layer.URL]["boxes"] = [];

            //Create checkboxes
            for(index = 0; index < Layer.attributes.length; index ++){
              // Create div to hold label and check box and another div to hold checkbox itself for styling
              var checkboxInput = domConstruct.create("div", {  class:"checkBoxInput" }, sourceFilters);

              // Create div to hole checkbox
              var checkboxDiv = domConstruct.create("div", { class:"checkBox" }, checkboxInput);

              //Create checkbox with default checked
              var checkBox = new CheckBox({
                name: Layer.attributes[index],
                checked: true,
                url: Layer.URL,
                onChange: function(){
                  current.setConfigOutfields(this.name, current.filterBoxes[this.url]);
                }
              },domConstruct.create("div", null, checkboxDiv));

              // Push into global variable array for checking
              current.filterBoxes[Layer.URL]["boxes"].push(checkBox);
              domConstruct.create("label", {  innerHTML: Layer.attributes[index], class:"checkBoxLabel" }, checkboxInput);
              domConstruct.create("br", null, sourceFilters);
            }
          })
        })
      },

      // Set the search parameters to filter by these attributes only
      setConfigOutfields: function(attribute, layerSource){
        var sources = this.searchDijit.get("sources");
        sources[layerSource["Index"]].searchFields = this.getFilterCheckboxArr(layerSource["boxes"]);
        this.searchDijit.sources = sources;
        // Uncomment the bottom and comment the top if u want source index to reset to all after each toggle
        // this.searchDijit.set("sources", sources); 
      },

      // Get the array of all filter checkboxes that are checked
      getFilterCheckboxArr: function(boxArray){
        var attrArr = [];
        arrayUtils.forEach(boxArray, function(box) { 
          if(box.checked){
            attrArr.push(box.name);
          }
        })
        return attrArr;
      },

      // Add the config in filterConfig.js as a new source
      addConfigSearchSource: function(){
        var sources = this.searchDijit.get("sources");
        sources = [];
        var self = this;
        // Get array of layers from filterConfig.js
        // arrayUtils.forEach(getQueryLayers(), function(Layer) { 
        //   sources.push({
        //     featureLayer: new FeatureLayer(Layer.URL),
        //     searchFields: Layer.attributes,
        //     suggestionTemplate: Layer.suggestionTemplate,
        //     exactMatch: false,
        //     outFields: ["*"],
        //     name: Layer.name,
        //     placeholder: Layer.placeholder,
        //     maxResults: Layer.maxResults,
        //     maxSuggestions: Layer.maxSuggestions,
        //     enableSuggestions: true,
        //     minCharacters: 0,
        //     localSearchOptions: {distance: 5000},
        //   });
          // self.filterBoxes[Layer.URL] = new Object();
          // self.filterBoxes[Layer.URL]["Index"] = sources.length - 1;       
        // })


        // this.sourceIndex = sources.length - 1;
        getQueryLayers().forEach(function(Layer, index){
          sources.push({
            featureLayer: new FeatureLayer(Layer.URL),
            searchFields: Layer.attributes,
            suggestionTemplate: Layer.suggestionTemplate,
            exactMatch: false,
            outFields: ["*"],
            name: Layer.name,
            placeholder: Layer.placeholder,
            maxResults: Layer.maxResults,
            maxSuggestions: Layer.maxSuggestions,
            enableSuggestions: true,
            minCharacters: 0,
            localSearchOptions: {distance: 5000},
          });
          self.filterBoxes[Layer.URL] = new Object();
          self.filterBoxes[Layer.URL]["Index"] = sources.length - 1;
          if(index == getQueryLayers().length-1){
            self.searchDijit.set("sources", sources);
          }
        });
        // this.searchDijit.set("sources", sources);
      },

      getSources: function(){
        var sources = [];
        var self = this;
        getQueryLayers().forEach(function(Layer, index){
          sources.push({
            featureLayer: new FeatureLayer(Layer.URL),
            searchFields: Layer.attributes,
            suggestionTemplate: Layer.suggestionTemplate,
            exactMatch: false,
            outFields: ["*"],
            name: Layer.name,
            placeholder: Layer.placeholder,
            maxResults: Layer.maxResults,
            maxSuggestions: Layer.maxSuggestions,
            enableSuggestions: true,
            minCharacters: 0,
            localSearchOptions: {distance: 5000},
          });
          self.filterBoxes[Layer.URL] = new Object();
          self.filterBoxes[Layer.URL]["Index"] = index;//sources.length - 1;
        });
      return sources;
      },

      onReceiveData: function(name, widgetId, data) {
        if (name === 'framework' && widgetId === 'framework' && data && data.searchString) {
          this.searchDijit.set('value', data.searchString);
          this.searchDijit.search();
        }
      },

      setPosition: function(position) {
        this._resetSearchDijitStyle(position);
        this.inherited(arguments);
      },

      resize: function() {
        this._resetSearchDijitStyle();
      },

      onLayerInfosFilterChanged: function(changedLayerInfos) {
        array.some(changedLayerInfos, lang.hitch(this, function(info) {
          if (this.searchDijit && this.searchDijit.sources && this.searchDijit.sources.length > 0) {
            array.forEach(this.searchDijit.sources, function(s) {
              if (s._featureLayerId === info.id) {
                s.featureLayer.setDefinitionExpression(info.getFilter());
              }
            });
          }
        }));
      },

      _resetSearchDijitStyle: function() {
        html.removeClass(this.domNode, 'use-absolute');
        if (this.searchDijit && this.searchDijit.domNode) {
          html.setStyle(this.searchDijit.domNode, 'width', 'auto');
        }

        setTimeout(lang.hitch(this, function() {
          if (this.searchDijit && this.searchDijit.domNode) {
            var box = {
              w: !window.appInfo.isRunInMobile ? 274 : // original width of search dijit
                parseInt(html.getComputedStyle(this.domNode).width, 10)
            };
            var sourcesBox = html.getMarginBox(this.searchDijit.sourcesBtnNode);
            var submitBox = html.getMarginBox(this.searchDijit.submitNode);
            var style = null;
            if (box.w) {
              html.setStyle(this.searchDijit.domNode, 'width', box.w + 'px');
              html.addClass(this.domNode, 'use-absolute');

              if (isFinite(sourcesBox.w) && isFinite(submitBox.w)) {
                if (window.isRTL) {
                  style = {
                    left: submitBox.w + 'px',
                    right: sourcesBox.w + 'px'
                  };
                } else {
                  style = {
                    left: sourcesBox.w + 'px',
                    right: submitBox.w + 'px'
                  };
                }
                var inputGroup = query('.searchInputGroup', this.searchDijit.domNode)[0];

                if (inputGroup) {
                  html.setStyle(inputGroup, style);
                  var groupBox = html.getMarginBox(inputGroup);
                  var extents = html.getPadBorderExtents(this.searchDijit.inputNode);
                  html.setStyle(this.searchDijit.inputNode, 'width', groupBox.w - extents.w + 'px');
                }
              }
            }
          }
        }), 50);
      },

      _convertConfig: function(config) {
        var sourceDefs = array.map(config.sources, lang.hitch(this, function(source) {
          var def = new Deferred();
          if (source && source.url && source.type === 'locator') {
            var _source = {
              locator: new Locator(source.url || ""),
              outFields: ["*"],
              singleLineFieldName: source.singleLineFieldName || "",
              name: jimuUtils.stripHTML(source.name || ""),
              placeholder: jimuUtils.stripHTML(source.placeholder || ""),
              countryCode: source.countryCode || "",
              maxSuggestions: source.maxSuggestions,
              maxResults: source.maxResults || 6,
              zoomScale: source.zoomScale || 50000,
              useMapExtent: !!source.searchInCurrentMapExtent,
              enableInfoWindow: esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                !!this.config.showInfoWindowOnSelect : true,
              showInfoWindowOnSelect: esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                !!this.config.showInfoWindowOnSelect : true,
              _zoomScaleOfConfigSource: source.zoomScale,
              _panToScale: source.panToScale
            };

            if (source.enableLocalSearch) {
              _source.localSearchOptions = {
                minScale: source.localSearchMinScale,
                distance: source.localSearchDistance
              };
            }

            if (source.panToScale || source.zoomScale) {
              _source.autoNavigate = false;
            }

            def.resolve(_source);
          } else if (source && source.url && source.type === 'query') {
            var searchLayer = new FeatureLayer(source.url || null, {
              outFields: ["*"]
            });

            this.own(on(searchLayer, 'load', lang.hitch(this, function(result) {
              var flayer = result.layer;

              // identify the data source
              var sourceLayer = this.map.getLayer(source.layerId);
              var sourceLayerInfo = this.layerInfosObj.getLayerInfoById(source.layerId);
              var showInfoWindowOnSelect;
              var enableInfoWindow;
              if(sourceLayer) {
                // pure feature service layer defined in the map
                showInfoWindowOnSelect = false;
                enableInfoWindow = false;
              } else if (sourceLayerInfo){
                // feature service layer defined in the map
                showInfoWindowOnSelect = false;
                enableInfoWindow = false;
              } else {
                // data source from the outside
                showInfoWindowOnSelect = esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                  !!this.config.showInfoWindowOnSelect : true;
                enableInfoWindow = esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                  !!this.config.showInfoWindowOnSelect : true;
              }

              var fNames = null;
              if (source.searchFields && source.searchFields.length > 0) {
                fNames = source.searchFields;
              } else {
                fNames = [];
                array.forEach(flayer.fields, function(field) {
                  if (field.type !== "esriFieldTypeOID" && field.name !== flayer.objectIdField &&
                    field.type !== "esriFieldTypeGeometry") {
                    fNames.push(field.name);
                  }
                });
              }

              var convertedSource = {
                featureLayer: flayer,
                outFields: ["*"],
                searchFields: fNames,
                autoNavigate: false,
                displayField: source.displayField || "",
                exactMatch: !!source.exactMatch,
                name: jimuUtils.stripHTML(source.name || ""),
                placeholder: jimuUtils.stripHTML(source.placeholder || ""),
                maxSuggestions: source.maxSuggestions || 6,
                maxResults: source.maxResults || 6,
                zoomScale: source.zoomScale || 50000,
                //infoTemplate: lang.clone(template),
                useMapExtent: !!source.searchInCurrentMapExtent,
                showInfoWindowOnSelect: showInfoWindowOnSelect,
                enableInfoWindow: enableInfoWindow,
                _featureLayerId: source.layerId,
                _zoomScaleOfConfigSource: source.zoomScale,
                _panToScale: source.panToScale
              };
              /*
              if (!template) {
                delete convertedSource.infoTemplate;
              }
              */
              if (convertedSource._featureLayerId) {
                var layerInfo = this.layerInfosObj
                  .getLayerInfoById(convertedSource._featureLayerId);
                if(layerInfo) {
                  flayer.setDefinitionExpression(layerInfo.getFilter());
                }
              }

              //var template = this._getInfoTemplate(flayer, source, source.displayField);
              this._getInfoTemplate(flayer, source).then(lang.hitch(this, function(infoTemplate){
                convertedSource.infoTemplate = lang.clone(infoTemplate);
                def.resolve(convertedSource);
              }), lang.hitch(this, function() {
                def.resolve(convertedSource);
              }));
            })));

            this.own(on(searchLayer, 'error', function() {
              def.resolve(null);
            }));
          } else {
            def.resolve(null);
          }
          return def;
        }));

        return sourceDefs;
      },

      _getInfoTemplate: function(fLayer, source) {
        var def = new Deferred();
        var layerInfo = this.layerInfosObj.getLayerInfoById(source.layerId);
        var template;
        //var template = layerInfo && layerInfo.getInfoTemplate();
        //var validTemplate = layerInfo && template;

        if (layerInfo) {
          def = layerInfo.loadInfoTemplate();
        } else { // (added by user in setting) or (only configured fieldInfo)
          /*
          template = new InfoTemplate();
          template.setTitle('&nbsp;');
          template.setContent(
            lang.hitch(this, '_formatContent', source.name, fLayer, source.displayField)
          );
          def.resolve(template);
          */

          var fieldNames = [];
          array.filter(fLayer.fields, function(field) {
            var fieldName = field.name.toLowerCase();
            if(fieldName.indexOf("shape") < 0 &&
               fieldName.indexOf("objectid") < 0 &&
               fieldName.indexOf("globalid") < 0 &&
               fieldName.indexOf("perimeter") < 0) {
              fieldNames.push(field.name);
            }
          });

          //var displayValue = graphic.attributes[source.displayField];
          var title =  source.name + ": {" + source.displayField + "}";
          var popupInfo = jimuUtils.getDefaultPopupInfo(fLayer, title, fieldNames);
          if(popupInfo) {
            template = new PopupTemplate(popupInfo);
          }
          def.resolve(template);
        }
        return def;
      },

      /*
      _getInfoTemplate: function(fLayer, source, displayField) {
        var layerInfo = this.layerInfosObj.getLayerInfoById(source.layerId);
        var template = layerInfo && layerInfo.getInfoTemplate();
        var validTemplate = layerInfo && template;

        if (layerInfo && !validTemplate) { // doesn't enabled pop-up
          return null;
        } else if (validTemplate) {
          // configured media or attachments
          return template;
        } else { // (added by user in setting) or (only configured fieldInfo)
          template = new InfoTemplate();
          template.setTitle('&nbsp;');
          template.setContent(
            lang.hitch(this, '_formatContent', source.name, fLayer, displayField)
          );

          return template;
        }
      },
      */

      _getSourcePopupInfo: function(source) {
        if (source._featureLayerId) {
          var layerInfo = this.layerInfosObj.getLayerInfoById(source._featureLayerId);
          if (layerInfo) {
            return layerInfo.getPopupInfo();
          }
        }
        return null;
      },

      // this funciton is deprecated.
      _captureSelect: function(e) {
        var sourceIndex = this.searchDijit.activeSourceIndex;
        if (sourceIndex === 'all') {
          sourceIndex = this._getSourceIndexOfResult(e);
        }
        if (isFinite(sourceIndex) && esriLang.isDefined(sourceIndex)) {
          var source = this.searchDijit.sources[sourceIndex];
          if (source && 'featureLayer' in source) {

            var popupInfo = this._getSourcePopupInfo(source);
            var notFormatted = (popupInfo && popupInfo.showAttachments) ||
              (popupInfo && popupInfo.description &&
              popupInfo.description.match(/http(s)?:\/\//)) ||
              (popupInfo && popupInfo.mediaInfos && popupInfo.mediaInfos.length > 0);

            // set a private property for select-result to get original feature from layer.
            if (!e.feature.__attributes) {
              e.feature.__attributes = e.feature.attributes;
            }

            if (!notFormatted) {
              var formatedAttrs = this._getFormatedAttrs(
                lang.clone(e.feature.attributes),
                source.featureLayer.fields,
                source.featureLayer.typeIdField,
                source.featureLayer.types,
                popupInfo
              );

              e.feature.attributes = formatedAttrs;
            }
          }
        }

        return [e];
      },

      _getSourceIndexOfResult: function(e) {
        if (this.searchResults){
          for (var i in this.searchResults) {
            var sourceResults = this.searchResults[i];
            var pos = array.indexOf(sourceResults, e);
            if (pos > -1) {
              return parseInt(i, 10);
            }
          }
        }

        return null;
      },

      _formatContent: function(title, fLayer, displayField, graphic) {
        var content = "";
        if (graphic && graphic.attributes && fLayer && fLayer.url) {
          var aliasAttrs = {};
          array.forEach(fLayer.fields, lang.hitch(this, function(field) {
            if (field.name in graphic.attributes){
              aliasAttrs[field.alias || field.name] = graphic.attributes[field.name];
            }
          }));
          var displayValue = graphic.attributes[displayField];
          content += '<div class="esriViewPopup">' +
            '<div class="mainSection">' +
            (esriLang.isDefined(displayValue) ?
              ('<div class="header">' + title + ': ' + displayValue + '</div>') : "") +
            '<div class="hzLine"></div>' +
            '<div>' +
            '<table class="attrTable" cellpading="0" cellspacing="0">' +
            '<tbody>';
          for (var p in aliasAttrs) {
            if (aliasAttrs.hasOwnProperty(p)) {
              content += '<tr valign="top">' +
                '<td class="attrName">' + p + '</td>' +
                '<td class="attrValue">' + aliasAttrs[p] + '</td>' +
                '</tr>';
            }
          }
          content += '</tbody>' +
            '</table>' +
            '</div>' +
            '<div class="break"></div>' +
            '</div>';
        }

        return content;
      },

      // this funciton is deprecated.
      _getFormatedAttrs: function(attrs, fields, typeIdField, types, popupInfo) {
        function getFormatInfo(fieldName) {
          if (popupInfo && esriLang.isDefined(popupInfo.fieldInfos)) {
            for (var i = 0, len = popupInfo.fieldInfos.length; i < len; i++) {
              var f = popupInfo.fieldInfos[i];
              if (f.fieldName === fieldName) {
                return f.format;
              }
            }
          }

          return null;
        }

        var aliasAttrs = {};
        array.forEach(fields, lang.hitch(this, function(_field, i) {
          if (!attrs[_field.name]) {
            return;
          }
          var isCodeValue = !!(_field.domain && _field.domain.type === 'codedValue');
          var isDate = _field.type === "esriFieldTypeDate";
          var isTypeIdField = typeIdField && (_field.name === typeIdField);
          var fieldAlias = _field.name;

          if (fields[i].type === "esriFieldTypeDate") {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getFormattedDate(
              attrs[_field.name], getFormatInfo(_field.name)
              );
          } else if (fields[i].type === "esriFieldTypeDouble" ||
            fields[i].type === "esriFieldTypeSingle" ||
            fields[i].type === "esriFieldTypeInteger" ||
            fields[i].type === "esriFieldTypeSmallInteger") {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getFormattedNumber(
              attrs[_field.name], getFormatInfo(_field.name)
              );
          }

          if (isCodeValue) {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getCodedValue(
              _field.domain, attrs[_field.name]
              );
          } else if (isTypeIdField) {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getTypeName(
              attrs[_field.name], types
              );
          } else if (!isCodeValue && !isDate && !isTypeIdField) {
            // Not A Date, Domain or Type Field
            // Still need to check for codedType value
            aliasAttrs[fieldAlias] = fieldAlias in aliasAttrs ?
              aliasAttrs[fieldAlias] : attrs[_field.name];
            aliasAttrs[fieldAlias] = this.getCodeValueFromTypes(
              _field,
              typeIdField,
              types,
              attrs,
              aliasAttrs
            );
          }
        }));
        return aliasAttrs;
      },

      getCodeValueFromTypes: function(field, typeIdField, types, obj, aliasAttrs) {
        var codeValue = null;
        if (typeIdField && types && types.length > 0) {
          var typeChecks = array.filter(types, lang.hitch(this, function(item) {
            // value of typeIdFild has been changed above
            return item.name === obj[typeIdField];
          }));
          var typeCheck = (typeChecks && typeChecks[0]) || null;

          if (typeCheck && typeCheck.domains &&
            typeCheck.domains[field.name] && typeCheck.domains[field.name].codedValues) {
            codeValue = jimuUtils.fieldFormatter.getCodedValue(
              typeCheck.domains[field.name],
              obj[field.name]
            );
          }
        }
        var fieldAlias = field.name;
        var _value = codeValue !== null ? codeValue : aliasAttrs[fieldAlias];
        return _value || isFinite(_value) ? _value : "";
      },

      _resetSelectorPosition: function(cls) {
        var layoutBox = html.getMarginBox(window.jimuConfig.layoutId);
        query(cls, this.domNode).forEach(lang.hitch(this, function(menu) {
          var menuPosition = html.position(menu);
          if (html.getStyle(menu, 'display') === 'none') {
            return;
          }
          var dijitPosition = html.position(this.searchDijit.domNode);
          var up = dijitPosition.y - 2;
          var down = layoutBox.h - dijitPosition.y - dijitPosition.h;
          if ((down > menuPosition.y + menuPosition.h) || (up > menuPosition.h)) {
            html.setStyle(
              menu,
              'top',
              (
                (down > menuPosition.y + menuPosition.h) ?
                dijitPosition.h : -menuPosition.h - 2
              ) + 'px'
            );
          } else {
            html.setStyle(menu, 'height', Math.max(down, up) + 'px');
            html.setStyle(menu, 'top', (down > up ? dijitPosition.h : -up - 2) + 'px');
          }
        }));
      },

      _onSourceIndexChange: function() {
        var source = null;
        if(!isNaN(this.searchDijit.activeSourceIndex) && this.searchDijit.activeSourceIndex != null){
          source = this.searchDijit.get("sources")[this.searchDijit.activeSourceIndex].featureLayer;
          if(source){
            this._toggleFilterContainers(source.url);
          }
          else{
            this._toggleFilterContainers("none");
          }
        }
        else if(this.searchDijit.activeSourceIndex){
          if(this.checkBtn){
            this._toggleFilterContainers("none");
          }
        }
        if (this.searchDijit.value) {
          this.searchDijit.search(this.searchDijit.value);
        }
      },

      _toggleFilterContainers: function(url){
        if(url == "none"){
          domStyle.set(this.checkBtn, "display", "none");
          domStyle.set(this.filterContainer, "display", "none");
        }
        else{
          domStyle.set(this.filterContainer, "display", "block");
          domStyle.set(this.checkBtn, "display", "table-cell");
        }
        for (var containerName in this.filterBoxes){
          if(containerName != url){
            this.filterBoxes[containerName]["container"].style.display = "none";
          }
          else{
            this.filterBoxes[containerName]["container"].style.display = "block";
          }
        }
      },

      _onSearchDijitClick: function() {
        this._resetSelectorPosition('.searchMenu');
      },

      _onSearchResults: function(evt) {
        var sources = this.searchDijit.get('sources');
        var activeSourceIndex = this.searchDijit.get('activeSourceIndex');
        var value = this.searchDijit.get('value');
        var htmlContent = "";
        var results = evt.results;

        var outputTextforCustomInput = this._getOutputTextForCustomInput(evt.value); //*******

        if (results && evt.numResults > 0) {
          html.removeClass(this.searchDijit.containerNode, 'showSuggestions');

          this.searchResults = results;
          htmlContent += '<div class="show-all-results jimu-ellipsis" title="' +
            this.nls.showAll + '">' +
            this.nls.showAllResults + '<strong >' + value + '</strong></div>';
          htmlContent += '<div class="searchMenu" role="menu">';
          for (var i in results) {
            if (results[i] && results[i].length) {
              var source = sources[parseInt(i, 10)];
              var name = source.name;
              if (sources.length > 1 && activeSourceIndex === 'all') {
                htmlContent += '<div title="' + name + '" class="menuHeader">' + name + '</div>';
              }
              htmlContent += "<ul>";
              var partialMatch = value;
              var r = new RegExp("(" + partialMatch + ")", "gi");
              var maxResults = sources[i].maxResults;

              for (var j = 0, len = results[i].length; j < len && j < maxResults; j++) {
                //var text = esriLang.isDefined(results[i][j].name) ?
                //  results[i][j].name : this.nls.untitled;
                var text;
                if(esriLang.isDefined(results[i][j].name)) {
                  if(source && source.locator && outputTextforCustomInput) {
                    results[i][j].name = outputTextforCustomInput;
                  }
                  text = results[i][j].name;
                } else {
                  text = this.nls.untitled;
                }

                htmlContent += '<li title="' + text + '" data-index="' + j +
                  '" data-source-index="' + i + '" role="menuitem" tabindex="0">' +
                  text.toString().replace(r, "<strong >$1</strong>") + '</li>';
              }
              htmlContent += '</url>';

              if (evt.numResults === 1) {
                _activeSourceNumber = i;
              }
            }
          }
          htmlContent += "</div>";
          this.searchResultsNode.innerHTML = htmlContent;

          this._showResultMenu();

          this._resetSelectorPosition('.searchMenu');
        } else {
          this._onClearSearch();
        }
        // publish search results to other widgets
        this.publishData({
          'searchResults': evt
        });
      },

      _onSuggestResults: function(evt) {
        this._resetSelectorPosition('.searchMenu');

        this._hideResultMenu();
        // publish suggest results to other widgets
        this.publishData({
          'suggestResults': evt
        });
      },

      _onSelectSearchResult: function(evt) {
        var target = evt.target;
        while(!(html.hasAttr(target, 'data-source-index') && html.getAttr(target, 'data-index'))) {
          target = target.parentNode;
        }
        var result = null;
        var dataSourceIndex = html.getAttr(target, 'data-source-index');
        var dataIndex = parseInt(html.getAttr(target, 'data-index'), 10);
        // var sources = this.searchDijit.get('sources');

        if (dataSourceIndex !== 'all') {
          dataSourceIndex = parseInt(dataSourceIndex, 10);
        }
        if (this.searchResults && this.searchResults[dataSourceIndex] &&
          this.searchResults[dataSourceIndex][dataIndex]) {
          result = this.searchResults[dataSourceIndex][dataIndex];
          this._zoomToPoint(result.feature.geometry)
          this.searchDijit.select(result);
        }
      },

      _zoomToPoint(geometry){
        // geometry.setX(-121457.9483293097);
        // geometry.setY(1220677.2239853442);
        this.map.emit('click', {mapPoint: geometry});  
      },

      //Get Path of JSON dynamically
      getJSPath(){
        var array = window.location.href.split("/");
        var JSONpath;
        if(array[array.length - 1] == "" || array[array.length - 1] == null){
          JSONpath = window.location.href + "widgets/Identify/Widget.js";
        }
        else{
          JSONpath = window.location.href.replace(array[array.length - 1],"widgets/Identify/Widget.js");
        }
        return JSONpath;
      },

      _convertSR: function(originalFun) {
        return lang.hitch(this, function(e) {
          var source = this.searchDijit.sources[e.index];
          var pointOfSpecifiedWkid = this._getPointFromSpecifiedWkid(e.text);
          //var pointOfSpecifiedUtm = this._getPointFromSpecifiedUtm(e.text);
          if(source && source.locator && pointOfSpecifiedWkid) {
            return jimuUtils.projectToSpatialReference(pointOfSpecifiedWkid,
                                                       new SpatialReference({wkid: 4326}))
                    .then(lang.hitch(this, function(event, targetPoint) {
              var inputText = this._getFormatedInputFromPoint(targetPoint);
              if(inputText) {
                event.text = inputText;
              }
              return originalFun.apply(this.searchDijit, [event]);
            }, lang.clone(e)));
          } else if (source && source.locator){
            return this._getPointFromSpecifiedUtm(e.text).then(lang.hitch(this, function(event, pointOfSpecifiedUtm) {
              var inputText = this._getFormatedInputFromPoint(pointOfSpecifiedUtm);
              if(inputText) {
                event.text = inputText;
              }
              return originalFun.apply(this.searchDijit, [event]);
            }, lang.clone(e)));
          } else {
            return originalFun.apply(this.searchDijit, [e]);
          }

        });
      },

      _getFormatedInputFromPoint: function(point) {
        var inputText = null;
        if(point && !isNaN(point.x) && !isNaN(point.y)) {
          //inputText = "X:" + point.x + "," + "Y:" + point.y;
          inputText = "Y:" + point.y + "," + "X:" + point.x;
        }
        return inputText;
      },

      _getPointFromSpecifiedWkid: function(inputString) {
        var point = null;
        if(!inputString) {
          return point;
        }
        var coordinateParams = inputString.split(":");
        var coordinateText = coordinateParams[0];
        var wkid = Number(coordinateParams[1]);
        if(wkid && wkidUtils.isValidWkid(wkid) && coordinateText) {
          var coordinateValues = coordinateText.split(",");
          var x = Number(coordinateValues[0]);
          var y = Number(coordinateValues[1]);
          if(!isNaN(x) && !isNaN(y)) {
            point = new Point(x, y, new SpatialReference({wkid: wkid}));
          }
        }
        return point;
      },

      _getPointFromSpecifiedUtm: function(inputString) {
        var retDef = new Deferred();
        var resultPoint = null;
        if(!inputString) {
          retDef.resolve(resultPoint);
          return retDef;
        }

        if(coordinateFormatter.isSupported()) {
          if(coordinateFormatter.isLoaded()) {
            var point = coordinateFormatter.fromUtm(inputString,
                                                    new SpatialReference({wkid: 4326}),
                                                    "latitude-band-indicators");
            if(point && !isNaN(point.x) && !isNaN(point.y)) {
              resultPoint = point;
              this._pointOfSpecifiedUtmCache[inputString] = resultPoint;
            }
          } else {
            coordinateFormatter.load();
          }
          retDef.resolve(resultPoint);
        } else {
          var params = {
            sr: 4326,
            conversionType: "UTM",
            conversionMode: 'utmDefault',
            strings: [inputString]
          };
          var geometryService = esriConfig && esriConfig.defaults && esriConfig.defaults.geometryService;
          if(geometryService && geometryService.declaredClass === "esri.tasks.GeometryService") {
            geometryService.fromGeoCoordinateString(params, lang.hitch(this, function(result) {
              var x = Number(result[0][0]);
              var y = Number(result[0][1]);
              if(!isNaN(x) && !isNaN(y)) {
                resultPoint = new Point(x, y, new SpatialReference({wkid: 4326}));
                this._pointOfSpecifiedUtmCache[inputString] = resultPoint;
              }
              retDef.resolve(resultPoint);
            }), lang.hitch(this, function() {
              retDef.resolve(resultPoint);
            }));
          }
        }

        return retDef;
      },

      _getOutputTextForCustomInput: function(inputText) {
        var outputText = null;
        var pointOfSpecifiedWkid = this._getPointFromSpecifiedWkid(inputText);
        var pointOfSpecifiedUtm = this._pointOfSpecifiedUtmCache[inputText];
        if(pointOfSpecifiedWkid) {
          outputText = "X:" + pointOfSpecifiedWkid.x + " " + "Y:" + pointOfSpecifiedWkid.y;
        } else if(pointOfSpecifiedUtm){
          outputText = inputText;
        }
        return outputText;
      },

      _zoomToScale: function(zoomScale, features) {
        this.map.setScale(zoomScale);
        jimuUtils.featureAction.panTo(this.map, features);
      },

      _showPopupByFeatures: function(layerInfo, features, selectEvent) {
        /*jshint unused: false*/
        var location = null;
        var isPoint = false;

        if(this.config.showInfoWindowOnSelect) {
          //this.map.infoWindow.clearFeatures();
          //this.map.infoWindow.hide();
          this.map.infoWindow.setFeatures(features);
          if (features[0].geometry.type === "point") {
            location = features[0].geometry;
            isPoint = true;
          } else {
            var extent = features[0].geometry && features[0].geometry.getExtent();
            location = extent && extent.getCenter();
          }
          if(location) {
            this.map.infoWindow.show(location, {
              closetFirst: true
            });
          }
        } else {
          // hightlight result
          this.map.infoWindow.setFeatures(features);
          this.map.infoWindow.updateHighlight(this.map, features[0]);
          this.map.infoWindow.showHighlight();
        }

        // zoomto result
        if (selectEvent.source._panToScale) {
          jimuUtils.featureAction.panTo(this.map, features);
        } else if(selectEvent.source._zoomScaleOfConfigSource) {
          this._zoomToScale(selectEvent.source.zoomScale, features);
        } else {
          var featureSet = jimuUtils.toFeatureSet(features);
          jimuUtils.zoomToFeatureSet(this.map, featureSet);
        }
      },

      _loadInfoTemplateAndShowPopup: function(layerInfo, selectedFeature, selectEvent) {
        if(layerInfo) {
          this.searchDijit.clearGraphics();
          var layerObjectInMap = this.map.getLayer(layerInfo.id);
          if(layerInfo.isPopupEnabled() && layerObjectInMap) {
            this._showPopupByFeatures(layerInfo, [selectedFeature], selectEvent);
          } else {
            layerInfo.loadInfoTemplate().then(lang.hitch(this, function(infoTemplate) {
              //temporary set infoTemplate to selectedFeature.
              selectedFeature.setInfoTemplate(lang.clone(infoTemplate));
              this._showPopupByFeatures(layerInfo, [selectedFeature], selectEvent);
              // clear infoTemplate for selectedFeature;
              var handle = aspect.before(this.map, 'onClick', lang.hitch(this, function() {
                selectedFeature.setInfoTemplate(null);
                handle.remove();
              }));
            }));
          }
        }
      },

      _onSelectResult: function(e) {
        var result = e.result;
        var dataSourceIndex = e.sourceIndex;
        var sourceResults = this.searchResults[dataSourceIndex];
        var dataIndex = 0;
        var resultFeature = e.result.feature;
        var sourceLayerId = e.source._featureLayerId;

        var getGraphics = function(layer, fid) {
          var graphics = layer.graphics;
          var gs = array.filter(graphics, function(g) {
            return g.attributes[layer.objectIdField] === fid;
          });
          return gs;
        };

        for (var i = 0, len = sourceResults.length; i < len; i++) {
          if (jimuUtils.isEqual(sourceResults[i], result)) {
            dataIndex = i;
            break;
          }
        }
        query('li', this.searchResultsNode)
          .forEach(lang.hitch(this, function(li) {
            html.removeClass(li, 'result-item-selected');
            var title = html.getAttr(li, 'title');
            var dIdx = html.getAttr(li, 'data-index');
            var dsIndex = html.getAttr(li, 'data-source-index');

            if (result &&
              result.name &&
              title === result.name.toString() &&
              dIdx === dataIndex.toString() &&
              dsIndex === dataSourceIndex.toString()) {
              html.addClass(li, 'result-item-selected');
            }
          }));

        //var layer = this.map.getLayer(sourceLayerId);
        var layerInfo = this.layerInfosObj.getLayerInfoById(sourceLayerId);

        if (layerInfo) {
          layerInfo.getLayerObject().then(lang.hitch(this, function(layer) {
            var gs = getGraphics(layer, resultFeature.attributes[layer.objectIdField]);
            if (gs && gs.length > 0) {
              //this._showPopupByFeatures(gs);
              this._loadInfoTemplateAndShowPopup(layerInfo, gs[0], e);
            } else {

              var featureQuery = new FeatureQuery();
              featureQuery.where = layer.objectIdField + " = " +
                                 resultFeature.attributes[layer.objectIdField];
              featureQuery.outSpatialReference = this.map.spatialReference;

              layer.queryFeatures(featureQuery, lang.hitch(this, function(featureSet) {
                var selectedFeature = null;
                if(featureSet && featureSet.features.length > 0) {
                  selectedFeature = featureSet.features[0];
                  // working around for a bug of js-api.
                  //   incorrect geometry of polygon result of queryFeatures.
                  selectedFeature.geometry = resultFeature.geometry;

                  this._loadInfoTemplateAndShowPopup(layerInfo, selectedFeature, e);
                }
              }), lang.hitch(this, function() {
                // show popupInfo of searchResult.
                var selectedFeature = resultFeature;
                this._loadInfoTemplateAndShowPopup(layerInfo, selectedFeature, e);
              }));
            }
          }));

        } else if (e.source.featureLayer && !e.source.locator){
          // outside resource result:
          // zoomTo or panto by zoomToExtent, popup by search dijit
          if (e.source._panToScale) {
            jimuUtils.featureAction.panTo(this.map, [e.result.feature]);
          } else if(e.source._zoomScaleOfConfigSource) {
            this._zoomToScale(e.source._zoomScaleOfConfigSource, [e.result.feature]);
          } else {
            jimuUtils.zoomToExtent(this.map, e.result.extent);
          }
        } else {
          //result of geocoder service
          if (e.source._panToScale) {
            //panToScale is configed, panTo by jimuFeatureAction. popup by search dijit
            jimuUtils.featureAction.panTo(this.map, [e.result.feature]);
          } else if (e.source._zoomScaleOfConfigSource) {
            //zoomScale is configed, zoomto by _zoomScale. popup by search dijit
            this._zoomToScale(e.source._zoomScaleOfConfigSource, [e.result.feature]);
          }
          //zoomSclae keep default value, popup and zoomto by search dijit;
        }

        // publish select result to other widgets
        this.publishData({
          'selectResult': e
        });
      },

      _onClearSearch: function() {
        html.setStyle(this.searchResultsNode, 'display', 'none');
        this.searchResultsNode.innerHTML = "";
        this.searchResults = null;
        //this.map.infoWindow.hideHighlight();
      },

      _hideResultMenu: function() {
        query('.show-all-results', this.searchResultsNode).style('display', 'block');
        query('.searchMenu', this.searchResultsNode).style('display', 'none');
      },

      _showResultMenu: function() {
        html.setStyle(this.searchResultsNode, 'display', 'block');
        query('.show-all-results', this.searchResultsNode).style('display', 'none');
        query('.searchMenu', this.searchResultsNode).style('display', 'block');

        var groupNode = query('.searchInputGroup', this.searchDijit.domNode)[0];
        if (groupNode) {
          var groupBox = html.getMarginBox(groupNode);
          var style = {
            width: groupBox.w + 'px'
          };
          if (window.isRTL) {
            var box = html.getMarginBox(this.searchDijit.domNode);
            style.right = (box.w - groupBox.l - groupBox.w) + 'px';
          } else {
            style.left = groupBox.l + 'px';
          }
          query('.show-all-results', this.searchResultsNode).style(style);
          query('.searchMenu', this.searchResultsNode).style(style);
        }
      },

      destroy: function() {
        utils.setMap(null);
        utils.setLayerInfosObj(null);
        utils.setAppConfig(null);
        if (this.searchDijit) {
          this.searchDijit.clear();
        }

        this.inherited(arguments);
      },

      _hidePopup: function() {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }
      },

      onActive: function() {
        this._mapClickHandle = aspect.before(this.map, 'onClick', lang.hitch(this, function() {
          this._hidePopup();
          return arguments;
        }));
      },

      onDeActive: function() {
        if (this._mapClickHandle && this._mapClickHandle.remove) {
          this._mapClickHandle.remove();
        }
        this._hidePopup();
      }
    });
  });
