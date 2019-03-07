var self;
define(['dojo/_base/declare',
         'jimu/BaseWidget',
         'esri/request',
         'esri/tasks/ClassBreaksDefinition',
         'dojo/data/ItemFileReadStore',
         'esri/tasks/AlgorithmicColorRamp',
         'esri/Color',
         'esri/symbols/SimpleFillSymbol',
         'esri/tasks/GenerateRendererParameters',
         'esri/tasks/GenerateRendererTask',
         'dijit/registry',
         'dojo/dom',
         'dojo/dom-style',
         'dojo/_base/array',
         'dijit/form/FilteringSelect',
         "dijit/form/CheckBox",
         "dijit/form/HorizontalSlider",
         "dijit/form/HorizontalRule",
         "dijit/form/HorizontalRuleLabels",
         'dojo/dom-construct',
         'dojo/on',
         'esri/layers/FeatureLayer',
         'esri/layers/ArcGISTiledMapServiceLayer',
         'esri/layers/ArcGISDynamicMapServiceLayer',
         'esri/layers/LayerDrawingOptions' ,
         'esri/symbols/SimpleLineSymbol',
         'esri/renderers/ClassBreaksRenderer',
         'esri/renderers/UniqueValueRenderer',
         'esri/dijit/Legend',
         'jimu/LayerInfos/LayerInfos'
        ],
function(declare, 
         BaseWidget,
         esriRequest,
         ClassBreaksDefinition,
         ItemFileReadStore,
         AlgorithmicColorRamp,
         Color,
         SimpleFillSymbol,
         GenerateRendererParameters,
         GenerateRendererTask,
         registry,
         dom,
         domStyle,
         arrayUtils,
         FilteringSelect,
         CheckBox,
         HorizontalSlider,
         HorizontalRule,
         HorizontalRuleLabels,
         domConstruct,
         on,
         FeatureLayer,
         ArcGISTiledMapServiceLayer,
         ArcGISDynamicMapServiceLayer,
         LayerDrawingOptions,
         SimpleLineSymbol,
         ClassBreaksRenderer,
         UniqueValueRenderer,
         Legend,
         LayerInfos) {
        var currentLayer = null;
        var selectedLayer = null;
        var selectedAttribute = null;
        var layerConfig = null;
        var layerBtn;
        var originalLayerRenderer= null;
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,
    
    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      // console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      var app = {};
      var dropdownContainers = new Object();
      self = this;
      app.defaultFrom = "#ffffcc";
      app.defaultTo = "#006837";
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      // var currentLayer = null;
      // get field info
      // debugger;
    //   var layer = new FeatureLayer("https://services1.arcgis.com/6txKVziKkZ2VHz7Z/ArcGIS/rest/services/processed_Farm_land/FeatureServer/0", {
    //     "id": "Washington",
    //  });
    //  self.map.addLayer(layer);

    // ----------- Junwei authored the below section ------ //
    //Get JSON data of layers with AJAX
      setClearBtn(this);
      if(layerConfig == null){
        $.getJSON( getJSONPath(), function( data ){
          layerConfig = data;
          toggleLayerFields();
        });
      }
      else{
        toggleLayerFields();
      }

    function setClearBtn(current){
      var clearBtn = dom.byId("clearClassificationBtn");

      //Set onclick event callback for clear button
      on(clearBtn, 'click', function(evt){
        current.clear();
      });
    }

    function toggleLayerFields(){
       // Create new "div" element for innerHTML label
       domConstruct.create("div", { innerHTML: "Currently selected attribute:", class:"selectLabel" }, dom.byId("layerWrapper"));

       // Drowdown for layers
       var layerWrapper = dom.byId("layerWrapper");
       layerBtn = domConstruct.create("div", { innerHTML:"Select a Layer", id: "layerSelectContainerButton", class:"checkBoxContainerButton" }, layerWrapper);
       var layerContainer = domConstruct.create("div", { id: "layerContainer", class:"attrLayerContainer" }, layerWrapper);
       domStyle.set(layerContainer, "display", "none");
       dropdownContainers["layerSelectContainerButton"] = layerContainer;

       //Set onclick event callback for category button
       on(layerBtn, 'click', function(evt){
        layerBtn.classList.toggle("active");
        dropdownCheck("layerSelectContainerButton");
        if(layerContainer.style.display == "none") {
          domStyle.set(layerContainer, "display", "block");
        }
        else
          domStyle.set(layerContainer, "display", "none");
      });

      // Go through each layer
      var index = 0;
      arrayUtils.forEach(layerConfig.layers, function(layer) { 
        //Create div to hold label and check box and another div to hold checkbox itself for styling
        var listLayer = domConstruct.create("div", {  class:"layerBoxInput" }, layerContainer);
        domConstruct.create("label", {  innerHTML: layer.Name, class:"layerBoxLabel" }, listLayer);

        //Set onclick event callback for category button
        on(listLayer, 'click', function(evt){
          domConstruct.empty("fieldWrapper");
          domConstruct.empty("legendWrapper");
          layerBtn.classList.toggle("active");
          domStyle.set(layerContainer, "display", "none");
          layerBtn.innerHTML = layer.Name;

          // Store List of attributes for each layer into array
          var attributes = [];
          arrayUtils.forEach(layer.Attributes, function(attr) {
            attributes.push(attr.Name);
          })
          selectedLayer = layer;
           // Toggle list of attributes dropdown
          toggleAttributeFields(attributes, layer.URL, 
             layer.ID, layer.Dropdown_style.width, layer.Dropdown_style.fontSize, 
             layer.Dropdown_style.color, layer.Name, index);
          // removeLayer();
          // addLayer(layer.URL,layer.ID, layer.Name);
        });

        domConstruct.create("br", null, layerContainer);
        index++;
      });
       //New dropdown end
    }

    // Get JSON file of widget dynamically
    function getJSONPath(){
      var array = window.location.href.split("/");
      var JSONpath;
      if(array[array.length - 1] == "" || array[array.length - 1] == null){
        JSONpath = window.location.href + "widgets/Classification/layer.json";
      }
      else{
        JSONpath = window.location.href.replace(array[array.length - 1],"widgets/Classification/layer.json");
      }
      return JSONpath;
    }

    // Add Layer
    function addLayer(URL,ID, Name){
      var selectedLayer = new FeatureLayer(URL,{
        id: ID
      });
      self.map.addLayer(selectedLayer);
      currentLayer = selectedLayer;
    }

    // Add Layer
    function removeLayer(){
      if(currentLayer != null){
        self.map.removeLayer(currentLayer);
        selectedLayer = null;
        selectedAttribute = null;
      }
    }

    //Dropdown check
    function dropdownCheck(containerName){
      for (var name in dropdownContainers) {
        if(document.getElementById(name) && name != containerName && dropdownContainers[name].style.display == "block"){
          if(name != "filterBoxContainerButton"){
            document.getElementById(name).classList.toggle("active");
          }
          dropdownContainers[name].style.display = "none";
        }
      }
    }

    // Display dropdown of all attributes and set render styles
    function toggleAttributeFields(attributes, URL, ID, width, font, color, layer_name, index){
      // Create new "div" element for innerHTML label
      var fieldWrapper = dom.byId("fieldWrapper");
      domConstruct.create("div", { innerHTML: "Currently selected attribute:", class:"selectLabel" }, fieldWrapper);

      // Request for the layer using URL from selected Layer earlier
      // var countyFields = esriRequest({
      //   url: URL,
      //   content: {
      //     f: "json"
      //   },
      //   callbackParamName: "callback"
      // });

      // Set the dropdown fields for attributes
      // countyFields.then(function(resp) {
          //New dropdown
      var fieldBtn = domConstruct.create("div", { innerHTML:"Select an Attribute", id: "fieldSelectContainerButton", class:"checkBoxContainerButton" }, fieldWrapper);
      var fieldContainer = domConstruct.create("div", { id: "fieldContainer", class:"attrLayerContainer" }, fieldWrapper);
      domStyle.set(fieldContainer, "display", "none");
      dropdownContainers["fieldSelectContainerButton"] = fieldContainer;

      //Set onclick event callback for dropdown
      on(fieldBtn, 'click', function(evt){
        fieldBtn.classList.toggle("active");
        dropdownCheck("fieldSelectContainerButton");
        if(fieldContainer.style.display == "none") {
          domStyle.set(fieldContainer, "display", "block");
        }
        else
          domStyle.set(fieldContainer, "display", "none");
      });

      arrayUtils.forEach(selectedLayer.Attributes, function(attribute) { 
        //Create div to hold label and check box and another div to hold checkbox itself for styling
        var listAttr = domConstruct.create("div", {  class:"layerBoxInput" }, fieldContainer);
        domConstruct.create("label", {  innerHTML: attribute.Display_Name, class:"layerBoxLabel" }, listAttr);

        //Set onclick event callback for each attribute
        on(listAttr, 'click', function(evt){
          domConstruct.empty("valueWrapper");
          fieldBtn.classList.toggle("active");
          domStyle.set(fieldContainer, "display", "none");
          fieldBtn.innerHTML = attribute.Display_Name;

          selectedAttribute = attribute;
          applyRenderer(attribute.Name, ID, layer_name, selectedLayer.Layer_ID);
        });

        domConstruct.create("br", null, fieldContainer);
      });
      // }, function(err) {
      //   // console.log("failed to get field names: ", err);
      // });

      // function getData(field,ID, layer_name, Layer_ID) {
      //   // Apply Render
      //   applyRenderer(field,ID, layer_name)
      // }

      function applyRenderer(field, ID, layer_name, Layer_ID) {

        // Get Layer and attribute render information according to URL
        var renderStyle;
        var renderer;
        var isBreak;
        var defaultSymbol
        var attr_name;

        renderStyle = selectedAttribute.Render_style;
        isBreak = selectedAttribute.isBreak;
        attr_name = selectedAttribute.Name;

        if(isBreak){
          var symbol = new SimpleFillSymbol();
          symbol.setColor(new Color([150, 150, 150, 0.5]));
          renderer = new ClassBreaksRenderer(symbol, attr_name);

          // Loop through styles of attribute, make sure they exists in the styles of the chosen attribute
          for(index = 0; index < renderStyle.length; index++){
            var field_symbol= new SimpleFillSymbol();
            field_symbol.setColor(new Color(renderStyle[index].color));
            // Uncomment to remove border
            field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 1));
            // renderer.addBreak(renderStyle[index].From, renderStyle[index].To, field_symbol,"hello");
            renderer.addBreak({

              minValue: renderStyle[index].From,
            
              maxValue: renderStyle[index].To,
            
              symbol: field_symbol,
            
              label: renderStyle[index].From + " to " + renderStyle[index].To
            
            });
          }
          reapplyRenderLegend(renderer, ID, layer_name, true, Layer_ID);
        }
        else{
          var defaultSymbol = new SimpleFillSymbol().setColor(new Color([127, 127, 127, 0.5]));
          defaultSymbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 0.5));
          renderer = new UniqueValueRenderer(defaultSymbol, field);

          // Loop through styles of attribute, make sure they exists in the styles of the chosen attribute
          for(index = 0; index < renderStyle.length; index++){
            var field_symbol= new SimpleFillSymbol();
            field_symbol.setColor(new Color(renderStyle[index].color));
            // Uncomment to remove border
            field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 0.5));
            renderer.addValue(renderStyle[index].Name,field_symbol);
          }
          reapplyRenderLegend(renderer, ID, layer_name, false, Layer_ID);
        }
        toggleAttributeValues(renderer, ID, layer_name, Layer_ID);
      }

      //Apply the legend after rendering the attributes
      function applyLegend(layer, layer_name){
        var legend = new Legend({
          map : self.map,
          layerInfos : [{
              layer : layer,
              title : layer_name,
              hideLayers: selectedLayer.hiddenLayer_IDS
          }]
        }, domConstruct.create("div", { class:"attr_legend" }, dom.byId("legendWrapper")));
        legend.startup();
      }

      function errorHandler(err) {
        // console.log("error: ", JSON.stringify(err));
      }

      function toggleAttributeValues(renderer, ID, layerName, Layer_ID){
        var attr_value;
        var CheckedMultiSelect;

        // Create Container to hold all check boxes
        var valueContainer = domConstruct.create("div", { id: "valueContainer", class:"valueContainer" }, dom.byId("valueWrapper"));

        // Check if attribute values are numerical 
        if(selectedAttribute.isBreak == false){

          //Create button to toggle filter
          var checkBtn = domConstruct.create("div", { innerHTML:"Filter Value", id: "filterBoxContainerButton", class:"filterBoxContainerButton" }, valueContainer);
          var checkContainer = domConstruct.create("div", { id: "checkBoxContainer", class:"checkBoxContainer" }, valueContainer);
          domStyle.set(checkContainer, "display", "none");
          dropdownContainers["filterBoxContainerButton"] = checkContainer;

          //Set onclick event callback for category button
          on(checkBtn, 'click', function(evt){
            dropdownCheck("filterBoxContainerButton");
            if(checkContainer.style.display == "none") {
              domStyle.set(checkContainer, "display", "block");
            }
            else
              domStyle.set(checkContainer, "display", "none");
          });

          // Loop through attribute values
          for(index = 0; index < selectedAttribute.Render_style.length; index ++){

            //Get the name of the value
            attr_value = selectedAttribute.Render_style[index].Name;
            attr_color = selectedAttribute.Render_style[index].color;

            //Create div to hold label and check box and another div to hold checkbox itself for styling
            var checkBoxInput = domConstruct.create("div", {  id: "checkBoxInput"+index, class:"checkBoxInput" }, checkContainer);

            //Create color symbol
            var symbol = domConstruct.create("div", { class:"symbol" }, dom.byId("checkBoxInput"+index));
            domStyle.set(symbol, "background", new Color(attr_color).toHex());

            // Create div to hole checkbox
            var checkBox = domConstruct.create("div", {  id: "checkBox"+index, class:"checkBox" }, checkBoxInput);

            //Create checkbox with default checked
            var checkBox = new CheckBox({
              name: attr_value,
              value: attr_color,
              checked: true,
              onChange: function(){ 
                if(!this.checked){
                  renderer.removeValue(this.name);
                  reapplyRenderLegend(renderer, ID, layerName, false, Layer_ID);
                }
                else{
                  renderer.addValue(this.name, new SimpleFillSymbol().setColor(new Color(this.value)));
                  reapplyRenderLegend(renderer, ID, layerName, false, Layer_ID);
                }
              }
            },domConstruct.create("div", null, checkBox));

            domConstruct.create("label", {  innerHTML: attr_value, class:"checkBoxLabel" }, checkBoxInput);
            domConstruct.create("br", null, checkContainer);
          }
        }
        else{
          //------------------------ Start of Check box codes for Classbreaks--------------------------
          //Create button to toggle filter
          var checkBtn = domConstruct.create("div", { innerHTML:"Filter Value", id: "filterBoxContainerButton", class:"filterBoxContainerButton" }, valueContainer);
          var checkContainer = domConstruct.create("div", { id: "checkBoxContainer", class:"checkBoxContainer" }, valueContainer);
          domStyle.set(checkContainer, "display", "none");
          dropdownContainers["filterBoxContainerButton"] = checkContainer;

          //Set onclick event callback for category button
          on(checkBtn, 'click', function(evt){
            dropdownCheck("filterBoxContainerButton");
            if(checkContainer.style.display == "none") {
              domStyle.set(checkContainer, "display", "block");
            }
            else
              domStyle.set(checkContainer, "display", "none");
          });

          // Loop through attribute values
          for(index = 0; index < selectedAttribute.Render_style.length; index ++){
            var checkBoxArr = [];
            //Get the name of the value
            attr_value = selectedAttribute.Render_style[index].From + " to " + selectedAttribute.Render_style[index].To;
            var attr_color = selectedAttribute.Render_style[index].color;
            var From = selectedAttribute.Render_style[index].From;
            var To = selectedAttribute.Render_style[index].To;

            //Create div to hold label and check box and another div to hold checkbox itself for styling
            var checkBoxInput = domConstruct.create("div", {  id: "checkBoxInput"+index, class:"checkBoxInput" }, checkContainer);

            //Create color symbol
            var symbol = domConstruct.create("div", { class:"symbol" }, dom.byId("checkBoxInput"+index));
            domStyle.set(symbol, "background", new Color(attr_color).toHex());

            // Create div to hole checkbox
            var checkBox = domConstruct.create("div", {  id: "checkBox"+index, class:"checkBox" }, checkBoxInput);

            //Create checkbox with default checked
            var checkBox = new CheckBox({
              name: attr_value,
              value: attr_color,
              from: From,
              to: To,
              checked: true,
              onChange: function(){ 
                if(!this.checked){
                  // renderer.removeValue(this.name);
                  renderer.removeBreak(this.from, this.to)
                  reapplyRenderLegend(renderer, ID, layerName, true, Layer_ID);
                }
                else{
                  var field_symbol = new SimpleFillSymbol();
                  field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 0.5));
                  field_symbol.setColor(new Color(this.value));
                  // renderer.addBreak(this.from, this.to, field_symbol);
                  renderer.addBreak({
                    minValue: this.from,
                    maxValue:this.to,
                    symbol: field_symbol,
                    label: this.from + " to " + this.to
                  });
                  reapplyRenderLegend(renderer, ID, layerName, true, Layer_ID);
                }
              }
            },domConstruct.create("div", null, checkBox));
            checkBoxArr.push(checkBox);

            domConstruct.create("label", {  innerHTML: attr_value, class:"checkBoxLabel" }, checkBoxInput);
            domConstruct.create("br", null, checkContainer);
          }
          //------------------------ End of Check box codes for Classbreaks--------------------------

          // ------------------------------- Start of Slider codes -----------------------------------//
          // Get max numerical value and amount of discrete levels
          // var max = selectedAttribute.Render_style[selectedAttribute.Render_style.length-1].To;
          // var discreteVal = selectedAttribute.Render_style.length
          // var labelArr = [];

          // // Form Label value array
          // for(value = 0; value < discreteVal + 1; value++){
          //   var displayAmt = value * (max/(discreteVal));
          //   var displayStr = Math.round(displayAmt);
          //   if(displayAmt >= 1000){
          //     displayStr = (displayAmt/1000) + "K";
          //   }
          //   if(displayAmt >= 1000000){
          //     displayStr = (displayAmt/1000000) + "M";
          //   }
          //   labelArr.push(displayStr);
          // }

          // // Create div to hold slider for styling
          // var sliderContainer = domConstruct.create("div", {  id: "sliderInput", class:"sliderInput" }, valueContainer);

          // var slider = new HorizontalSlider({
          //   name: "slider",
          //   value: max,
          //   minimum: 0,
          //   maximum: max,
          //   discreteValues: discreteVal + 1,
          //   intermediateChanges: true,
          //   style: "width: 100%;",
          //   onChange: function(){
              // renderer.clearBreaks();
              // for(index = 0; index < selectedAttribute.Render_style.length; index ++){
              //   var attr = selectedAttribute.Render_style[index];
              //   var field_symbol= new SimpleFillSymbol();
              //   field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 0.5));
              //   field_symbol.setColor(new Color(attr.color));
              //   if(this.value > attr.From){
              //     // renderer.addBreak(attr.From, attr.To, field_symbol);
              //     renderer.addBreak({

              //       minValue: attr.From,
                  
              //       maxValue: attr.To,
                  
              //       symbol: field_symbol,
                  
              //       label: attr.From + " to " + attr.To
                  
              //     });
              //   }
              // }
              // reapplyRenderLegend(renderer, ID, layerName, true, Layer_ID);
          //   }
          // }, domConstruct.create("div", null, sliderContainer));

          // //Create div to hold label markers for styling
          // var labelContainer = domConstruct.create("div", {  id: "sliderLabelInput", class:"sliderLabelInput" }, valueContainer);

          // var sliderRules = new HorizontalRule({
          //   container: "bottomDecoration",
          //   count: discreteVal + 1,
          //   style: "height: 5px; margin: 0 12px;"
          // }, domConstruct.create("div", null, labelContainer));  

          // //Create div to hold numeric labels for styling
          // var labelContainer2 = domConstruct.create("ol", {  id: "sliderLabelInput2", class:"sliderLabelInput2" }, valueContainer);

          // var sliderLabels = new HorizontalRuleLabels({
          //   container: "bottomDecoration",
          //   labels: labelArr,
          //   labelStyle: "font-size: 0.75em",
          //   style: "height: 1em; font-weight: bold;"
          // }, domConstruct.create("div", null, labelContainer2));
        // ------------------------------- End of Slider codes -----------------------------------//
        }
      }

      function reapplyRenderLegend(renderer, ID, layerName, check, Layer_ID){
        // Check if is dynamic layer or not
        if(self.map.getLayer(ID)){
          if(originalLayerRenderer == null){
            originalLayerRenderer = self.map.getLayer(ID).renderer;
          }
          domConstruct.empty("legendWrapper");
          self.map.getLayer(ID).setRenderer(renderer);
          self.map.getLayer(ID).redraw();
          // Uncomment if they want the legend again
          // if(check){
          //   applyLegend(self.map.getLayer(ID),layerName);
          // }
        }
        else{
          // Loop through layers on the map and find the map corresponding to the URL
          for (var property in self.map._layers) {
            if (self.map._layers[property].url == selectedLayer.URL) {
              if(!self.map._layers[property].visibleLayers.includes(Layer_ID)){
                let visibleLayerArr = self.map._layers[property].visibleLayers.filter((v, i, a) => a.indexOf(v) === i && v != -1);
                visibleLayerArr.push(Layer_ID); 
                self.map._layers[property].setVisibleLayers(visibleLayerArr);
              }

              // Set the visible sublayer based on Layer_ID of the layer in layer.json
              var optionsArray = [];
              var drawingOptions = new LayerDrawingOptions();
              drawingOptions.renderer = renderer;
              optionsArray[Layer_ID] = drawingOptions;
              self.map._layers[property].setLayerDrawingOptions(optionsArray);
              // Uncomment if they want the legend again
              // domConstruct.empty("legendWrapper");
              // if(check){
              //   applyLegend(self.map._layers[property], selectedAttribute.Display_Name);
              // }
            }
          }
        }
      }
    }
    // ----------- End of Junwei's section ------ //
      // var countyFields = esriRequest({
      //   url: 'https://services1.arcgis.com/6txKVziKkZ2VHz7Z/ArcGIS/rest/services/processed_Farm_land/FeatureServer/0',
      //   content: {
      //     f: "json"
      //   },
      //   callbackParamName: "callback"
      // });
      // countyFields.then(function(resp) {
      //   var fieldNames, fieldStore;

      //   fieldNames = { identifier: "value", label: "name", items: [] };
      //   // console.log("Attributes \n"+resp.fields);
      //   arrayUtils.forEach(resp.fields.slice(0, 6), function(f) { // add some field names to the FS
      //     fieldNames.items.push({ "name": f.name, "value": f.name });
      //   });
      //   fieldStore = new ItemFileReadStore({ data: fieldNames });
      //   console.log(fieldStore);
      //   fieldSelect = new FilteringSelect({
      //     displayedValue: fieldNames.items[0].name,
      //     value: fieldNames.items[0].value,
      //     name: "fieldsFS",
      //     required: false,
      //     store: fieldStore,
      //     searchAttr: "name",
      //     style: {
      //        "width": "290px",
      //        "fontSize": "12pt",
      //        "color": "#444"
      //     }
      //  }, domConstruct.create("div", null, dom.byId("fieldWrapper")));
      //  fieldSelect.on("change", getData);
      // }, function(err) {
      //   console.log("failed to get field names: ", err);
      // });

      // function getData(field) {
      //   //classBreaks(app.defaultFrom, app.defaultTo,field);
      //   applyRenderer(field)
      // }
      // // function classBreaks(c1, c2,field) {
      // //   debugger;
      // //   var classDef = new ClassBreaksDefinition();
      // //   classDef.classificationField = field;
      // //   classDef.classificationMethod = "natural-breaks"; // always natural breaks
      // //   classDef.breakCount = 5; // always five classes
  
      // //   var colorRamp = new AlgorithmicColorRamp();
      // //   colorRamp.fromColor = new Color.fromHex(c1);
      // //   colorRamp.toColor = new Color.fromHex(c2);
      // //   colorRamp.algorithm = "hsv"; // options are:  "cie-lab", "hsv", "lab-lch"
  
      // //   classDef.baseSymbol = new SimpleFillSymbol("solid", null, null);
      // //   classDef.colorRamp = colorRamp;
  
      // //   var params = new GenerateRendererParameters();
      // //   params.classificationDefinition = classDef;
      // //   var generateRenderer = new GenerateRendererTask("https://services1.arcgis.com/6txKVziKkZ2VHz7Z/ArcGIS/rest/services/processed_Farm_land/FeatureServer/0");
      // //   generateRenderer.execute(params, applyRenderer, errorHandler);
      // // }
      // function applyRenderer(field) {
      //   // dynamic layer stuff
      //   var defaultSymbol = new SimpleFillSymbol().setColor(new Color([127, 127, 127, 0.5]));
        
      //   var renderer = new UniqueValueRenderer(defaultSymbol, field);
      //   renderer.addValue("Pineapple", new SimpleFillSymbol().setColor(new Color([255, 0, 0, 0.5])));
      //   renderer.addValue("Maize", new SimpleFillSymbol().setColor(new Color([0, 255, 0, 0.5])));
      //   renderer.addValue("Tea", new SimpleFillSymbol().setColor(new Color([0, 0, 255, 0.5])));
      //   renderer.addValue("Irrigated", new SimpleFillSymbol().setColor(new Color([255, 0, 255, 0.5])));
      //   renderer.addValue("Rainfed", new SimpleFillSymbol().setColor(new Color([255, 255, 255, 0.75])));
       
      //   self.map.getLayer("processed_Farm_land_7151").setRenderer(renderer);
      //   self.map.getLayer("processed_Farm_land_7151").redraw();
      //   // create the legend if it doesn't exist        
      // }
      // function errorHandler(err) {
      //   // console.log("Something broke, error: ", err);
      //   console.log("error: ", JSON.stringify(err));
      // }
            
    },

    clear: function(){
      this.removeRenderer(selectedLayer.ID,selectedLayer.Layer_ID)
      if(currentLayer != null){
        self.map.removeLayer(currentLayer);
        currentLayer = null;
        selectedLayer = null;
        selectedAttribute = null;
        layerConfig = null;
      }
      layerBtn.innerHTML = "Select a Layer";
      domConstruct.empty("fieldWrapper");
      domConstruct.empty("valueWrapper");
      domConstruct.empty("legendWrapper");
    },

    removeRenderer: function(ID, Layer_ID){
      if(ID && originalLayerRenderer){
        self.map.getLayer(ID).setRenderer(originalLayerRenderer);
        self.map.getLayer(ID).redraw();
      }
      else{
        // Loop through layers on the map and find the map corresponding to the URL
        for (var property in self.map._layers) {
          if (self.map._layers[property].url == selectedLayer.URL) {
            var optionsArray = [];
            var drawingOptions = new LayerDrawingOptions();
            drawingOptions.renderer = null;
            optionsArray[Layer_ID] = drawingOptions;
            self.map._layers[property].setLayerDrawingOptions(optionsArray);
          }
        }
      }
    },
   
    onOpen: function(){
      // console.log('onOpen');
    },

    onClose: function(){
      // this.clear();
      // console.log("onclose");
    },

    onMinimize: function(){
      // console.log('onMinimize');
    },

    onMaximize: function(){
      // console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      // console.log('onSignIn');
    },

    onSignOut: function(){
      // console.log('onSignOut');
    },

    showVertexCount: function(count){
      //this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    }
  });
});