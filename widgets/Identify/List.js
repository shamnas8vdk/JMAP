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
      _listItems: [],
      tabContainer : null,
      displayContainer: null,
      layerListConfig : null,
      listContainers : new Object(),

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

        this.tabContainer = domConstruct.create('div', { class:"tabContainer", id:"tabContainer" }, this.domNode,"first");
        this.setLayerListConfig();
      },

      setLayerListConfig: function(){
        var current = this;
        $.getJSON( this.getJSONPath(), function( data ){
          current.layerListConfig = data;
          current.setTabContainer(current.tabContainer, data.layer_list);
        })
      },

      //Get Path of JSON dynamically
      getJSONPath: function(){
        var array = window.location.href.split("/");
        var JSONpath;
        if(array[array.length - 1] == "" || array[array.length - 1] == null){
          JSONpath = window.location.href + "widgets/Identify/category.json";
        }
        else{
          JSONpath = window.location.href.replace(array[array.length - 1],"widgets/Identify/category.json");
        }
        return JSONpath;
      },

      // Set the tab bar with material web library
      setTabContainer: function(tabContainer, valueArr){
        // Create Divs to hold tab based on material design
        var tabBar = domConstruct.create('div', { role:"tablist", class:"mdc-tab-bar" }, tabContainer);
        var scroller = domConstruct.create('div', { class:"mdc-tab-scroller"}, tabBar);
        var scrollArea = domConstruct.create('div', { class:"mdc-tab-scroller__scroll-area"}, scroller);
        var scrollContent = domConstruct.create('div', { class:"mdc-tab-scroller__scroll-content scroll-tab", id:"scrollContent"},scrollArea);

        // Create array to hold all created items for styles
        var buttons = [];
        var current = this;
        for(index = 0; index < valueArr.length; index++){
          // Create containers for each tab layer and add to dictionary
          var tempContainer = domConstruct.create('div', { class: valueArr[index] }, this._listContainer);
          this.listContainers[valueArr[index]] = tempContainer;

          // Create button element and classes
          var button = domConstruct.create('button', { role:"tab", name: valueArr[index], class:"mdc-tab mdc-tab--active tabBtn", id: valueArr[index].replace(/\s/g, "")+"_btn"},scrollContent);
          domStyle.set(button, "border", "1px solid #1D8BD1");
          var spanContent = domConstruct.create('span', { class:"mdc-tab__content"},button);
          var spanText = domConstruct.create('span', { innerHTML:valueArr[index] ,class:"mdc-tab__text-label identify-tab"},spanContent);

          // Set first tab to active
          // if(index == 0){
            // domStyle.set(button, "border-right", "1px solid #1D8BD1");
            // var spanContentActive = domConstruct.create('span', { class:"mdc-tab-indicator mdc-tab-indicator--active"},button);
            // var spanTextActive = domConstruct.create('span', { class:"mdc-tab-indicator__content mdc-tab-indicator__content--underline identify-tab"},spanContentActive);
          // }
          var spanRipple = domConstruct.create('span', { class:"mdc-tab__ripple"},button);
          button.style.display = "none";
          buttons.push(button);
          // Set highlight tab on click
          on(button, 'click', function(evt){
            current.tabContainer.style.display = "block";
            this.style.display = "block";
            current.paddlesArrowDisplayCheck();
            // array.forEach(buttons, function(btn){
            //   var active = btn.getElementsByClassName("mdc-tab-indicator mdc-tab-indicator--active")[0];
            //   if(active){
            //     btn.removeChild(active);
            //   }
            // });
            // var spanContentActive = domConstruct.create('span', { class:"mdc-tab-indicator mdc-tab-indicator--active"}, this);
            // var spanTextActive = domConstruct.create('span', { class:"mdc-tab-indicator__content mdc-tab-indicator__content--underline identify-tab"},spanContentActive);
            current.toggleTab(this.name);
          });

          // var divider = domConstruct.create('div',{ class:"tab-divider"},scrollContent);
        }
        var paddles = this.setPaddles(scrollContent);
        // Make the tabs scrollable
        this.setTabScroll(scrollContent, paddles[0], paddles[1]);
      },

      // Create paddle arrows and set to scroll on click
      setPaddles: function(scrollContent){
        let currentOffSet = scrollContent.scrollLeft;
        var leftPaddle = domConstruct.create('button', { role:"tab", class:"mdc-tab mdc-tab--active paddle left-paddle", id: "leftPaddle"},scrollContent,"first");
        leftPaddle.innerText = "<";
        var rightPaddle = domConstruct.create('button', { role:"tab", class:"mdc-tab mdc-tab--active paddle right-paddle", id: "rightPaddle"},scrollContent,"last");
        rightPaddle.innerText = ">";
        domStyle.set(leftPaddle, "border-top", "1px solid #1D8BD1");
        domStyle.set(leftPaddle, "border-bottom", "1px solid #1D8BD1");
        domStyle.set(leftPaddle, "border-left", "1px solid #1D8BD1");
        domStyle.set(rightPaddle, "border-top", "1px solid #1D8BD1");
        domStyle.set(rightPaddle, "border-bottom", "1px solid #1D8BD1");
        domStyle.set(rightPaddle, "border-right", "1px solid #1D8BD1");

        on(leftPaddle, 'click', (e) => {
          scrollContent.scrollLeft-=50;
          if(scrollContent.scrollLeft == 0){
            leftPaddle.style.display = "none";
          }
          if(rightPaddle.style.display == "none"){
            rightPaddle.style.display = "block";
          }
          currentOffSet = scrollContent.scrollLeft;
        });

        on(rightPaddle, 'click', (e) => {
          scrollContent.scrollLeft+=50;
          if(scrollContent.scrollLeft == currentOffSet){
            rightPaddle.style.display = "none";
          }
          if(scrollContent.scrollLeft > 0){
            leftPaddle.style.display = "block";
          }
          currentOffSet = scrollContent.scrollLeft;
        });
        return [leftPaddle,rightPaddle];
      },

      // Check the width of the tab bar and display the arrows accordingly
      paddlesArrowDisplayCheck: function(){
        var tabScroll = document.getElementById("scrollContent");
        var leftPaddle = document.getElementById("leftPaddle");
        var rightPaddle = document.getElementById("rightPaddle");
        var maxScrollLeft = tabScroll.scrollWidth - tabScroll.clientWidth;
        // console.log(maxScrollLeft + " "+ tabScroll.scrollLeft);
        // console.log(rightPaddle.clientWidth);
        if(tabScroll.scrollLeft > 0 && leftPaddle.style.display != "block"){
          leftPaddle.style.display="block";
        }
        if(tabScroll.scrollLeft < maxScrollLeft && rightPaddle.style.display != "block"){
          rightPaddle.style.display="block";
        }
        if(tabScroll.scrollLeft == 0 && leftPaddle.style.display!="none"){
          leftPaddle.style.display="none";
        }
        if(tabScroll.scrollLeft <= maxScrollLeft && maxScrollLeft-2 <= tabScroll.scrollLeft && rightPaddle.style.display!="none"){
          rightPaddle.style.display="none";
        }
      },
      
      // Set to scroll by drag or wheel
      setTabScroll: function(tabScroll, leftPaddle, rightPaddle){
        let isDown = false;
        let startX;
        let scrollLeft = tabScroll.scrollLeft;
        var current = this;

        on(tabScroll, 'mousedown', (e) => {
          isDown = true;
          startX = e.pageX - tabScroll.offsetLeft;
          scrollLeft = tabScroll.scrollLeft;
        });

        on(tabScroll, 'mouseleave', () => {
          isDown = false;
        });

        on(tabScroll, 'mouseup', () => {
          isDown = false;
        });

        on(tabScroll, 'mousemove', (e) => {
          if(!isDown) return;
          e.preventDefault();
          const x = e.pageX - tabScroll.offsetLeft;
          const walk = (x - startX) * 3; //scroll-fast
          tabScroll.scrollLeft = scrollLeft - walk;
          current.paddlesArrowDisplayCheck();
        });

        on(tabScroll, "wheel", (e) =>{
          e.preventDefault();
          if(e.deltaY < 0){
            tabScroll.scrollLeft+=50;
            current.paddlesArrowDisplayCheck();
          }
          else{
            tabScroll.scrollLeft-=50;
            current.paddlesArrowDisplayCheck();
          }
        })
      },

      toggleView: function() {
        var cat = document.getElementById("container1");
        if (cat.style.display === "none") {
          cat.style.display = "block";
        } else {
          cat.style.display = "none";
        }
      },

      // Check if the geometry is already selected
      duplicateCheck: function(geom){
        for(itemNo=0; itemNo <this._listItems.length; itemNo++){
          if(JSON.stringify(this._listItems[itemNo].rings) == JSON.stringify(geom.rings)){
            return true;
          }
        }
        this._listItems.push(geom);
        return false;
      },

      // Remove the geom from the geometry checking array
      removeGeom: function(geom){
        for(itemNo=0; itemNo <this._listItems.length; itemNo++){
          if(JSON.stringify(this._listItems[itemNo].rings) == JSON.stringify(geom.rings)){
            this._listItems.splice(itemNo,1);
          }
        }
      },

      // Toggle the tab on click
      toggleTab: function(tabName){
        for (var containerName in this.listContainers) {
          if(containerName == tabName){
            document.getElementById(containerName.replace(/\s/g, "") + "_btn").click();
            this.listContainers[containerName].style.display = "block";
            this.displayContainer = this.listContainers[containerName];
          }
          else{
            this.listContainers[containerName].style.display = "none";
          }
        }
      },

      // Clear all the containers from each tab and hide tabs
      clearContainers: function(){
        this._listItems = [];
        $("rightPaddle").hide();
        $("leftPaddle").hide();
        for (var containerName in this.listContainers) {
          this.listContainers[containerName].innerHTML = "";
          $("#"+containerName.replace(/\s/g, "")+"_btn").hide();
        }
      },

      //LevelChecker
      checkLevelAdd: function(title, val){
        if(sessionStorage.getItem(title) != null){
          value = sessionStorage.getItem(title);
          if(val == value){
            return true;
          }
          else{
            return false;
          }
        }
        else{
          return true;
        }
      },

      add: function(item) {
        if (arguments.length === 0 || this.duplicateCheck(item.graphic.geometry)) {
          return;
        }
        this.items.push(item);
        var div = domConstruct.create('div');
        domAttr.set(div, 'id', this.id.toLowerCase()+item.id);
        domAttr.set(div, 'title', item.zoom2msg);

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

        var rTitle = domConstruct.create('p', { class:"title" },div);
        domAttr.set(rTitle, 'id', this.id.toLowerCase()+item.id);
        rTitle.textContent = rTitle.innerText = item.title;
        // domConstruct.place(rTitle, div);
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
        var levelCheck = true;

        // ----------- Junwei authored the below section ------ //
        // Store the current object ID and Item id for reference in the loops later
        var ID = this.id;
        var itemID = item.id;
        var layerTitle = item.title;

        // Disable tabs accordingly
        this.toggleTab(layerTitle);
        domConstruct.place(div, this.displayContainer, "first");

        //Create for loop to loop through each category
        for (CategoryNo = 0; CategoryNo < this.layerListConfig[layerTitle].type.length; CategoryNo++) {

          //Create a button for each category with the corresponding style
          var category = setCategoryButton();

          //Create a container for each category to encapsulate related data
          var container = setContainer(CategoryNo, category, this.layerListConfig, layerTitle);

          //Create a for loop for all attributes gotten from the object
          for (var AttributeIndex = 0; AttributeIndex < arrayLength; AttributeIndex++) {

            //Split the attributes and assign their corresponding font and styles
            attValArr = attArr[AttributeIndex].split(': ');
            attTitle = setAttributeTitle(ID, itemID);
            formatAttributeTitle(attTitle, ID, itemID)
  
            if (attValArr[1] === 'null') {
              attVal.textContent = attVal.innerText = " ";
            } else {
              attVal.textContent = attVal.innerText = " " + attValArr[1].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
            }

            // Check which Category this information belongs to, and adds them to the correct containers.
            if(categoryAttributesCheck(this.layerListConfig, CategoryNo, attTitle.textContent, layerTitle)) {
              if(attTitle.innerText.trim() == this.layerListConfig[layerTitle].display_key){
                setSelectedTitle(this.layerListConfig[layerTitle].layer_name+": "+attVal.innerText);
              }
              container.innerHTML += "<strong>"+ attTitle.innerText +" : </strong>"+ attVal.innerText+ "<br />";
              // domConstruct.place(attTitle, label);
              // domConstruct.place(attVal, label);
              // domConstruct.place(label, container);
            }
          }
        }
        domConstruct.place("<br/>", div);

        //Set title of the area
        function setSelectedTitle(title){
          rTitle.textContent = title;
        }

        //Create a button for each category with the corresponding style
        function setCategoryButton(){
          var category = domConstruct.create('div', { class:"toggle" });
          domStyle.set(category,  {
            background: 'white',
            color: '#1D8BD1',
            textDecoration: 'none',
            display: 'inline-block',
            padding: '8px 8px'
          });
          return category;
        }

        //Create a container for each category to encapsulate related data
        function setContainer(CategoryNo, category, data, tabType){
          var container = domConstruct.create('div',{ class:"attrCategory" });
          domStyle.set(container, "display", "none");
          category.classList.toggle("active");
          var categoryContainer = domConstruct.create('div', { class:"category" });
          category.textContent = data[tabType].type[CategoryNo].Heading;

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
        function categoryAttributesCheck(data, CategoryNo, attribute, tabType){
          var check =  true;

          if(data[tabType].type[CategoryNo].Attributes.indexOf(attribute) == -1){
            check = false;
          }

          for (i = CategoryNo-1; i > -1; i--){
            if(data[tabType].type[i].Attributes.indexOf(attribute) > -1){
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
        // domConstruct.place(div, displayContainer, "first");
        // domConstruct.place(displayContainer, this._listContainer);
      },

      // Rearrange the display the tabs on item removed from tab containers
      remove: function(index) {
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
        this.clearContainers();
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
        this.removeGeom(item.geometry);
        this.onRemoveDisplayCheck(item.title);
        this._selectedNode = id;
        this.emit('remove', this.selectedIndex, item);
      },

      onRemoveDisplayCheck: function(itemTitle){
        var isAllTabsHidden = true;
        if(this.listContainers[itemTitle].childNodes.length == 1){
          $("#"+itemTitle.replace(/\s/g, "")+"_btn").hide();
        }
        for (var property in this.listContainers) {
          if($("#"+property.replace(/\s/g, "")+"_btn").css('display') != "none"){
            $("#"+property.replace(/\s/g, "")+"_btn").click();
            isAllTabsHidden = false;
          }
        }
        if(isAllTabsHidden){
          this.tabContainer.style.display = "none";
          this.clearContainers();
        }
        this.paddlesArrowDisplayCheck();
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
