///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
/*global define */
define(['dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/lang',
    'dojox/gfx',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/_base/array',
    'dojo/query',
    'dojo/NodeList-traverse',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/Evented',
    'esri/symbols/jsonUtils',
    'esri/config',
    './customConfig'
  ],
  function(declare,
    _WidgetBase,
    lang,
    gfx,
    on,
    domConstruct,
    domAttr,
    array,
    query,
    traverse,
    dom,
    domClass,
    domStyle,
    Evented,
    jsonUtils,
    esriconfig,
    customConfig) {
    return declare([_WidgetBase, Evented], {

      'class': 'widgets-Identify-list',
      _itemCSS: 'identify-list-item',
      _itemSelectedCSS: 'identify-list-item selected',
      _itemAltCSS: 'identify-list-item alt',
      _wrapResults: null,

      startup: function() {
        this.customConfig = new customConfig();
        this.items = [];
        this.selectedIndex = -1;
        this._selectedNode = null;
        this._listContainer = domConstruct.create('div');
        domClass.add(this._listContainer, 'identify-list-container');
        this.own(on(this._listContainer, 'click', lang.hitch(this, this._onClick)));
        this.own(on(this._listContainer, 'mouseover', lang.hitch(this, this._onMouseOver)));
        this.own(on(this._listContainer, 'mouseout', lang.hitch(this, this._onMouseOut)));
        domConstruct.place(this._listContainer, this.domNode);
      },

      toggleView: function() {
        var cat = document.getElementById("container1");
        if (cat.style.display === "none") {
          cat.style.display = "block";
        } else {
          cat.style.display = "none";
        }
      },

      add: function(item) {
        if (arguments.length === 0) {
          return;
        }
        this.items.push(item);
        var div = domConstruct.create('div');
        domAttr.set(div, 'id', this.id.toLowerCase()+item.id);
        domAttr.set(div, 'title', item.zoom2msg);

        // var iconDiv = domConstruct.create('div');
        // domAttr.set(iconDiv, 'id', this.id.toLowerCase()+item.id);
        // domClass.add(iconDiv, 'iconDiv');
        // domConstruct.place(iconDiv, div);

        var removeDiv = domConstruct.create('div');
        domConstruct.place(removeDiv, div);
        domClass.add(removeDiv, 'removediv');
        domAttr.set(removeDiv, 'id', this.id.toLowerCase()+item.id);

        var removeDivImg = domConstruct.create('div');
        domClass.add(removeDivImg, 'removedivImg');
        domConstruct.place(removeDivImg, removeDiv);
        domAttr.set(removeDivImg, 'id', this.id.toLowerCase()+item.id);
        domAttr.set(removeDivImg, 'title', item.removeResultMsg);
        this.own(on(removeDivImg, 'click', lang.hitch(this, this._onRemove)));

        var rTitle = domConstruct.create('p', { class:"title" });
        domAttr.set(rTitle, 'id', this.id.toLowerCase()+item.id);
        rTitle.textContent = rTitle.innerText = item.title;
        domConstruct.place(rTitle, div);
        if(item.alt){
          domClass.add(div, this._itemCSS);
        }else{
          domClass.add(div, this._itemAltCSS);
        }
        if(this._wrapResults){
          domClass.add(div, "result-wrap");
        }

        var attArr = item.rsltcontent.split('<br>');
        var attValArr, tHasColor, bIndex, eIndex, tColor, vHasColor, vColor;
        var label, attTitle, attVal, breakline;
        var arrayLength = attArr.length;

        // ----------- Junwei authored the below section ------ //
        // Store the current object ID and Item id for reference in the loops later
        var ID = this.id;
        var itemID = item.id;
        // var btnContainer = domConstruct.create('div', { class:"btnContainer" });
        // domConstruct.place(btnContainer, div);

        // AJAX request for JSON of category information
        $.getJSON( getJSONPath(), function( data ){
          
          //Create for loop to loop through each category
          for (CategoryNo = 0; CategoryNo < data.categories.type.length; CategoryNo++) {

            //Create a button for each category with the corresponding style
            var category = setCategoryButton();

            //Create a container for each category to encapsulate related data
            var container = setContainer(CategoryNo, category, data);

            //Add button into btnContainer
            // domConstruct.place(category, btnContainer);

            //Create a for loop for all attributes gotten from the object
            for (var AttributeIndex = 0; AttributeIndex < arrayLength; AttributeIndex++) {

              //Split the attributes and assign their corresponding font and styles
              attValArr = attArr[AttributeIndex].split(': ');
              attTitle = setAttributeTitle(ID, itemID);
              formatAttributeTitle(attTitle, ID, itemID)
    
              if (attValArr[1] === 'null') {
                attVal.textContent = attVal.innerText = ": ";
              } else {
                attVal.textContent = attVal.innerText = ": " + attValArr[1].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
              }

              // Check which Category this information belongs to, and adds them to the correct containers.
              if(categoryAttributesCheck(data, CategoryNo, attTitle.textContent)) {
                if(attTitle.innerText.trim() == data.categories.display_key){
                  setSelectedTitle(data.categories.layer_name+": "+attVal.innerText);
                }
                container.innerHTML += attTitle.innerText + attVal.innerText+ "<br />";
                // domConstruct.place(attTitle, label);
                // domConstruct.place(attVal, label);
                // domConstruct.place(label, container);
              }
            }
          }
          domConstruct.place("<br/>", div);
        });

        //Get Path of JSON dynamically
        function getJSONPath(){
          var array = window.location.href.split("/");
          var JSONpath;
          if(array[array.length - 1] == "" || array[array.length - 1] == null){
            JSONpath = window.location.href + "widgets/Identify/category.json";
          }
          else{
            JSONpath = window.location.href.replace(array[array.length - 1],"widgets/Identify/category.json");
          }
          return JSONpath;
        }

        //Set title of the area
        function setSelectedTitle(title){
          rTitle.textContent = title;
        }

        //Create a button for each category with the corresponding style
        function setCategoryButton(){
          var category = domConstruct.create('div', { class:"toggle" });
          domStyle.set(category,  {
            background: '#1D8BD1',
            color: 'white',
            border: 'none',
            textDecoration: 'none',
            display: 'inline-block',
            padding: '8px 8px',
          });
          return category;
        }

        //Create a container for each category to encapsulate related data
        function setContainer(CategoryNo, category, data){
          var container = domConstruct.create('div',{ class:"attrCategory" });
          var categoryContainer = domConstruct.create('div', { class:"category" });
          category.textContent = data.categories.type[CategoryNo].Heading;

          //Set onclick event callback for category button
          on(category, 'click', function(evt){
            category.classList.toggle("active");
            if(container.style.display == "none") {
              domStyle.set(container, "display", "block");
            }
            else
              domStyle.set(container, "display", "none");
          });

          domConstruct.place(category, categoryContainer);
          domConstruct.place(container, categoryContainer);
          domConstruct.place(categoryContainer, div);
          // domStyle.set(categoryContainer, "display", "none");
          return container;
        }

        //Set attribute titles and styles for selected area
        function setAttributeTitle(ID, itemID){
          attTitle = domConstruct.create('font');
          domAttr.set(attTitle, 'id', ID.toLowerCase()+itemID);
          if(attValArr[0].toLowerCase().indexOf('<em>') > -1){
            domStyle.set(attTitle, 'font-style', 'italic');
          }
          if(attValArr[0].toLowerCase().indexOf('<strong>') > -1){
            domStyle.set(attTitle, 'font-weight', 'bold');
          }
          if(attValArr[0].toLowerCase().indexOf('<u>') > -1){
            domStyle.set(attTitle, 'text-decoration', 'underline');
          }
          tHasColor = (attValArr[0].toLowerCase().indexOf("<font color='") > -1)?true:false;
          if(tHasColor){
            bIndex = attValArr[0].toLowerCase().indexOf("<font color='") + 13;
            eIndex = attValArr[0].toLowerCase().indexOf("'>", bIndex);
            tColor = attValArr[0].substr(bIndex, eIndex - bIndex);
            domStyle.set(attTitle, 'color', tColor);
          }
          return attTitle;
        }

        //Format Attribute text content and styles
        function formatAttributeTitle(attTitle, ID, itemID){
          attTitle.textContent = attTitle.innerText = attValArr[0].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
          label = domConstruct.create('p');
          breakline = domConstruct.create('br');
          domAttr.set(label, 'id', ID.toLowerCase()+itemID);
          domClass.add(label, 'label');

          attVal = domConstruct.create('a');

          if(attValArr[1].toLowerCase().indexOf('<em>') > -1){
            domStyle.set(attVal, 'font-style', 'italic');
          }
          if(attValArr[1].toLowerCase().indexOf('<strong>') > -1){
            domStyle.set(attVal, 'font-weight', 'bold');
          }
          if(attValArr[1].toLowerCase().indexOf('<u>') > -1){
            domStyle.set(attVal, 'text-decoration', 'underline');
          }
          vHasColor = (attValArr[1].toLowerCase().indexOf("<font color='") > -1)?true:false;
          if(vHasColor){
            bIndex = attValArr[1].toLowerCase().indexOf("<font color='") + 13;
            eIndex = attValArr[1].toLowerCase().indexOf("'>", bIndex);
            vColor = attValArr[1].substr(bIndex, eIndex - bIndex);
            domStyle.set(attVal, 'color', vColor);
          }
        }

        //Check if attributes are in and unique to the category
        function categoryAttributesCheck(data, CategoryNo, attribute){
          var check =  true;

          if(data.categories.type[CategoryNo].Attributes.indexOf(attribute) == -1){
            check = false;
          }

          for (i = CategoryNo-1; i > -1; i--){
            if(data.categories.type[i].Attributes.indexOf(attribute) > -1){
              check = false
            }
          } 
          return check;
        }
        // ----------- End of Junwei's section ------ //

        // ----------- Ashley authored the below section ------ //
        // var categoryOne = domConstruct.create('button');
        // domStyle.set(categoryOne,  {
        //   background: '#008CBA',
        //   color: 'white',
        //   border: 'none',
        //   marginBottom: '10px',
        //   textDecoration: 'none',
        //   display: 'inline-block',
        //   padding: '15px 15px',
        // });
        // var container1 = domConstruct.create('container');
        // categoryOne.textContent = this.customConfig.categoryOne.Title;
        // domAttr.set(container1, 'id', "container1");
        // on(categoryOne, 'click', function(evt){
        //   if(container1.style.display == "none") {
        //     domStyle.set(container1, "display", "block");
        //   }
        //   else
        //     domStyle.set(container1, "display", "none");
        // });
        // domConstruct.place(categoryOne, div);
        // domConstruct.place(container1, div);

        // domConstruct.place("<br/>", div);
        // var categoryTwo = domConstruct.create('button');
        // domStyle.set(categoryTwo,  {
        //   background: '#008CBA',
        //   color: 'white',
        //   border: 'none',
        //   marginBottom: '10px',
        //   textDecoration: 'none',
        //   display: 'inline-block',
        //   padding: '15px 15px',
        // });
        // var container2 = domConstruct.create('container');
        // categoryTwo.textContent = this.customConfig.categoryTwo.Title;;
        // domAttr.set(container2, 'id', "container2");
        // on(categoryTwo, 'click', function(evt){
        //   if(container2.style.display == "none") {
        //     domStyle.set(container2, "display", "block");
        //   }
        //   else
        //     domStyle.set(container2, "display", "none");
        // });
        // domConstruct.place(categoryTwo, div);
        // domConstruct.place(container2, div);

        // domConstruct.place("<br/>", div);
        // var categoryThree = domConstruct.create('button');
        // domStyle.set(categoryThree,  {
        //   background: '#008CBA',
        //   color: 'white',
        //   border: 'none',
        //   marginBottom: '10px',
        //   textDecoration: 'none',
        //   display: 'inline-block',
        //   padding: '15px 15px',
        // });
        // var container3 = domConstruct.create('container');
        // categoryThree.textContent = this.customConfig.categoryThree.Title;;
        // domAttr.set(container3, 'id', "container3");
        // on(categoryThree, 'click', function(evt){
        //   if(container3.style.display == "none") {
        //     domStyle.set(container3, "display", "block");
        //   }
        //   else
        //     domStyle.set(container3, "display", "none");
        // });
        // domConstruct.place(categoryThree, div);
        // domConstruct.place(container3, div);

        // domConstruct.place("<br/>", div);
        // var categoryFour = domConstruct.create('button');
        // domStyle.set(categoryFour,  {
        //   background: '#008CBA',
        //   color: 'white',
        //   border: 'none',
        //   marginBottom: '10px',
        //   textDecoration: 'none',
        //   display: 'inline-block',
        //   padding: '15px 15px',
        // });
        // var container4 = domConstruct.create('container');
        // categoryFour.textContent = this.customConfig.categoryFour.Title;;
        // domAttr.set(container4, 'id', "container4");
        // on(categoryFour, 'click', function(evt){
        //   if(container4.style.display == "none") {
        //     domStyle.set(container4, "display", "block");
        //   }
        //   else
        //     domStyle.set(container4, "display", "none");
        // });
        // domConstruct.place(categoryFour, div);
        // domConstruct.place(container4, div);

        // for (var i = 0; i < arrayLength; i++) {
        //   attValArr = attArr[i].split(': ');
        //   attTitle = domConstruct.create('font');
        //   domAttr.set(attTitle, 'id', this.id.toLowerCase()+item.id);
        //   if(attValArr[0].toLowerCase().indexOf('<em>') > -1){
        //     domStyle.set(attTitle, 'font-style', 'italic');
        //   }
        //   if(attValArr[0].toLowerCase().indexOf('<strong>') > -1){
        //     domStyle.set(attTitle, 'font-weight', 'bold');
        //   }
        //   if(attValArr[0].toLowerCase().indexOf('<u>') > -1){
        //     domStyle.set(attTitle, 'text-decoration', 'underline');
        //   }
        //   tHasColor = (attValArr[0].toLowerCase().indexOf("<font color='") > -1)?true:false;
        //   if(tHasColor){
        //     bIndex = attValArr[0].toLowerCase().indexOf("<font color='") + 13;
        //     eIndex = attValArr[0].toLowerCase().indexOf("'>", bIndex);
        //     tColor = attValArr[0].substr(bIndex, eIndex - bIndex);
        //     domStyle.set(attTitle, 'color', tColor);
        //   }

        //   attTitle.textContent = attTitle.innerText = attValArr[0].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
        //   label = domConstruct.create('p');
        //   breakline = domConstruct.create('br');
        //   domAttr.set(label, 'id', this.id.toLowerCase()+item.id);
        //   domClass.add(label, 'label');
        //   attVal = domConstruct.create('font');

        //   if(attValArr[1].toLowerCase().indexOf('<em>') > -1){
        //     domStyle.set(attVal, 'font-style', 'italic');
        //   }
        //   if(attValArr[1].toLowerCase().indexOf('<strong>') > -1){
        //     domStyle.set(attVal, 'font-weight', 'bold');
        //   }
        //   if(attValArr[1].toLowerCase().indexOf('<u>') > -1){
        //     domStyle.set(attVal, 'text-decoration', 'underline');
        //   }
        //   vHasColor = (attValArr[1].toLowerCase().indexOf("<font color='") > -1)?true:false;
        //   if(vHasColor){
        //     bIndex = attValArr[1].toLowerCase().indexOf("<font color='") + 13;
        //     eIndex = attValArr[1].toLowerCase().indexOf("'>", bIndex);
        //     vColor = attValArr[1].substr(bIndex, eIndex - bIndex);
        //     domStyle.set(attVal, 'color', vColor);
        //   }

        //   if (attValArr[1] === 'null') {
        //     attVal.textContent = attVal.innerText = ": ";
        //   } else {
        //     attVal.textContent = attVal.innerText = ": " + attValArr[1].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
        //   }
        //   // Check which Category this information belongs to, and adds them to the correct containers.
        //   if(attTitle.textContent in this.customConfig.categoryOne) {
        //     domConstruct.place(attTitle, label);
        //     domConstruct.place(attVal, label);
        //     domConstruct.place(label, container1);
        //   }
        //   else if(attTitle.textContent in this.customConfig.categoryTwo) {
        //     domConstruct.place(attTitle, label);
        //     domConstruct.place(attVal, label);
        //     domConstruct.place(label, container2);
        //   }
        //   else if(attTitle.textContent in this.customConfig.categoryThree) {
        //     domConstruct.place(attTitle, label);
        //     domConstruct.place(attVal, label);
        //     domConstruct.place(label, container3);
        //   }
        //   else if(attTitle.textContent in this.customConfig.categoryFour) {
        //     domConstruct.place(attTitle, label);
        //     domConstruct.place(attVal, label);
        //     domConstruct.place(label, container4);
        //   }         
        // }
        // domConstruct.place("<br/>", div);
        //------------------------------------------------------------//

        // if(document.all && !document.addEventListener){
        //   //do nothing because it is IE8
        //   //And I can not produce swatches in IE8
        // }else{
        //   var mySurface = gfx.createSurface(iconDiv, 40, 40);
        //   var descriptors = jsonUtils.getShapeDescriptors(item.sym);
        //   if(descriptors.defaultShape){
        //     var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
        //     shape.applyTransform({ dx: 20, dy: 20 });
        //   }
        // }
        if(item.links && item.links.length > 0){
          var linksDiv = domConstruct.create("div");
          domConstruct.place(linksDiv, div);
          domClass.add(linksDiv, 'linksdiv');
        }
        
        array.forEach(item.links, function(link){
          if(link.popuptype === "text"){
            var linkText = domConstruct.toDom("<p><a href='" + link.link + "' target='_blank' title='" + link.alias + "'>" + link.alias + "</a></p>");
            domConstruct.place(linkText, linksDiv, 'before');
            domClass.add(linkText, 'labellink');
          }else{
            var linkImg = domConstruct.toDom("<a href='" + link.link + "' target='_blank' title='" + link.alias + "'><img src='" + link.icon + "' alt='" + link.alias + "' border='0' width='20px' height='20px' style='vertical-align: middle;'></a>");
            domConstruct.place(linkImg, linksDiv);
            domClass.add(linkImg, 'linkIcon');
          }
        });
        domConstruct.place(div, this._listContainer,"first");
      },

      remove: function(index) {
        // this.selectedIndex = -1;
        // this._selectedNode = null;
        // var item = this.items[index];
        // domConstruct.destroy(this.id.toLowerCase() + item.id + '');
        // this.items.splice(index, 1);
        // if (this.items.length === 0) {
        //   this._init();
        // }
        var item = this.items[index];
        domConstruct.destroy(this.id.toLowerCase() + item.id + "");
        this.items.splice(index, 1);
        if (this.items.length === 0) {
          this._init();
        }
        if(item.id === this._selectedNode){
          this._selectedNode = null;
        }
        this.clearSelection();
      },

      _init: function() {
        this.selectedIndex = -1;
        this._selectedNode = null;
      },

      clear: function() {
        this.items.length = 0;
        this._listContainer.innerHTML = '';
        this._init();
      },

      _onClick: function(evt) {
        if (evt.target.id === '' && evt.target.parentNode.id === '') {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }

        domClass.replace(id, this._itemSelectedCSS, ((item.alt) ? this._itemAltCSS:this._itemCSS));
        if (this._selectedNode) {
          domClass.replace(this._selectedNode, ((item.alt)? this._itemAltCSS:this._itemCSS), this._itemSelectedCSS);
        }
        this._selectedNode = id;
        this.emit('click', this.selectedIndex, item);
      },

      _onMouseOver: function(evt) {
        if (evt.target.id === '' && evt.target.parentNode.id === '') {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }

        this._selectedNode = id;
        this.emit('mouseover', this.selectedIndex, item);
      },

      _onMouseOut: function(evt) {
        if (evt.target.id === '' && evt.target.parentNode.id === '') {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }

        this._selectedNode = id;
        this.emit('mouseout', this.selectedIndex, item);
      },

      _onRemove: function(evt) {
        evt.stopPropagation();

        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }
        this._selectedNode = id;
        this.emit('remove', this.selectedIndex, item);
      },

      addComplete: function() {
        this.clearSelection();
      },

      clearSelection: function () {
        this._selectedNode = null;
        this.selectedIndex = -1;
        query('.identify-list-item').forEach(function(node){
          domClass.remove(node, "alt");
          domClass.remove(node, "selected");
        });
        array.map(this.items, lang.hitch(this, function(item, index){
          item.alt = !(index % 2 === 0);
          if(item.alt){
            domClass.add(this.id.toLowerCase() + item.id + "", "alt");
          }
        }));
      },

      _getItemById: function(id) {
        id = id.replace(this.id.toLowerCase(),'');
        var len = this.items.length;
        var item;
        for (var i = 0; i < len; i++) {
          item = this.items[i];
          if (item.id === id) {
            this.selectedIndex = i;
            return item;
          }
        }
        return null;
      }
    });
  });
