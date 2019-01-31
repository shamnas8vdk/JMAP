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
         'esri/layers/MapImageLayer',
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
         MapImageLayer,
         ArcGISTiledMapServiceLayer,
         ArcGISDynamicMapServiceLayer,
         LayerDrawingOptions,
         SimpleLineSymbol,
         ClassBreaksRenderer,
         UniqueValueRenderer,
         Legend,
         LayerInfos) {
        var currentLayer = null;
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,
    
    baseClass: 'jimu-widget-demo',
    currentLayer: null,

    postCreate: function() {
      this.inherited(arguments);
      // console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      var app = {};
      var layerConfig = null;
      var selectedLayer = null;
      var selectedAttribute = null;
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

    if(layerConfig == null){
      $.getJSON( getJSONPath(), function( data ){
        layerConfig = data;
        toggleLayerFields()
      });
    }
    else{
      toggleLayerFields()
    }

    function toggleLayerFields(){
       // Create new "div" element for innerHTML label
       domConstruct.create("div", { innerHTML: "Currently selected attribute:", class:"selectLabel" }, dom.byId("layerWrapper"));
  
       // Declare object to store layer names in layerNames and store them in layerStore
       var layerNames, layerStore;
       layerNames = { identifier: "value", label: "name", items: [] };
       layerNames.items.push({ "name": "Select a Layer", "value": "Select a Layer"});
 
       arrayUtils.forEach(layerConfig.layers, function(f) { 
         // Store List of attributes for each layer into array
         var attributes = [];
         arrayUtils.forEach(f.Attributes, function(g) {
           attributes.push(g.Name);
         })
         // Push information into array for storage in Filtering Select Object
         layerNames.items.push({ "name": f.Name, "value": f.Name, "width": f.Dropdown_style.width, 
         "fontSize": f.Dropdown_style.fontSize, "color": f.Dropdown_style.color,"attributes": attributes, 
         "URL": f.URL, "ID": f.ID});
       });
       layerStore = new ItemFileReadStore({ data: layerNames });
       
       //Declare new dropdown FilteringSelect object and store the variables
       layerSelect = new FilteringSelect({
       displayedValue: layerNames.items[0].name,
       value: layerNames.items[0].value,
       name: "layersFS",
       required: false,
       store: layerStore,
       searchAttr: "name",
       style: {
           "width": layerNames.items[1].width,
           "fontSize": layerNames.items[1].fontSize,
           "color": layerNames.items[1].color
       },
       onChange: function(){
         // removeLayer();
         // Get selected index and toggle to show attributes of selected layer
         var index = this.item._0;
         domConstruct.empty("fieldWrapper");
         domConstruct.empty("legendWrapper");
 
         if(index != 0){
           // Add the layer so it will appear in layerlist widget
           // addLayer(layerNames.items[index].URL[0],layerNames.items[index].ID[0],layerNames.items[index].name)
           selectedLayer = layerConfig.layers[index-1];
           // Toggle list of attributes dropdown
           toggleAttributeFields(layerNames.items[index].attributes, layerNames.items[index].URL, 
             layerNames.items[index].ID, layerNames.items[index].width, layerNames.items[index].fontSize, 
             layerNames.items[index].color, layerNames.items[index].name, index-1);
         }
       } 
       },domConstruct.create("div", { class:"selectBox" }, dom.byId("layerWrapper")));
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
      var selectedLayer = new MapImageLayer(URL,{
        id: ID
      });
      self.map.addLayer(selectedLayer);
      currentLayer = selectedLayer;
    }

    // Add Layer
    function removeLayer(){
      if(currentLayer != null){
        self.map.removeLayer(currentLayer);
      }
    }

    // Display dropdown of all attributes and set render styles
    function toggleAttributeFields(attributes, URL, ID, width, font, color, layer_name, index){
      // Create new "div" element for innerHTML label
      domConstruct.create("div", { innerHTML: "Currently selected attribute:", class:"selectLabel" }, dom.byId("fieldWrapper"));

      // Request for the layer using URL from selected Layer earlier
      var countyFields = esriRequest({
        url: URL[0],
        content: {
          f: "json"
        },
        callbackParamName: "callback"
      });

      // Set the dropdown fields for attributes
      countyFields.then(function(resp) {
        // Store information of each attribute in arrays
        var fieldNames, fieldStore;
        var attributeIndex = 0;
        fieldNames = { identifier: "value", label: "name", items: [] };
        fieldNames.items.push({ "name": "Select an Attribute", "value": "Select an Attribute"});

        arrayUtils.forEach(resp.fields, function(attribute) {
          if(attributes.indexOf(attribute.name) > -1){
             attributes.forEach(function(item,atrIndex,atrArray){
              if(item==attribute.name)
              fieldNames.items.push({ "name": selectedLayer.Attributes[atrIndex].Display_Name, "value": selectedLayer.Attributes[atrIndex].Name });
             });
          }
        })

        fieldStore = new ItemFileReadStore({ data: fieldNames });

        // Declare new FilteringSelect object for dropdown and initialize fields
        fieldSelect = new FilteringSelect({
          displayedValue: fieldNames.items[0].name,
          value: fieldNames.items[0].value,
          name: "fieldsFS",
          required: false,
          store: fieldStore,
          searchAttr: "name",
          style: {
             "width": width,
             "fontSize": font,
             "color": color
          },
          onChange: function(){
            var index = this.item._0;
            var selectedItem = this;
            domConstruct.empty("valueWrapper");
            // domConstruct.empty("legendWrapper");

            // Render CSS Styles of map on change with getData
            if(index != 0){
              selectedLayer.Attributes.forEach(function(item,itemIdex,itemArray){
                if(selectedItem.item.value[0] == item.Name){
                   selectedAttribute = selectedLayer.Attributes[itemIdex];
                   getData(selectedItem.item.value[0], ID, layer_name);
                 }
              });
            }
          } 
       }, domConstruct.create("div", { class:"selectBox" }, dom.byId("fieldWrapper")));
      }, function(err) {
        // console.log("failed to get field names: ", err);
      });

      function getData(field,ID, layer_name) {
        // Apply Render
        applyRenderer(field,ID, layer_name)
      }

      function applyRenderer(field, ID, layer_name) {

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
          // symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 0));
          // defaultSymbol = new SimpleFillSymbol().setColor(new Color([127, 127, 127, 0.5]));
          renderer = new ClassBreaksRenderer(symbol, attr_name);

          // Loop through styles of attribute, make sure they exists in the styles of the chosen attribute
          for(index = 0; index < renderStyle.length; index++){
            var field_symbol= new SimpleFillSymbol();
            field_symbol.setColor(new Color(renderStyle[index].color));
            // Uncomment to remove border
            field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 1));
            renderer.addBreak(renderStyle[index].From, renderStyle[index].To, field_symbol);
          }
          reapplyRenderLegend(renderer, ID, layer_name, true);
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
          reapplyRenderLegend(renderer, ID, layer_name, false);
        }
        toggleAttributeValues(renderer, ID, layer_name);
      }

      //Apply the legend after rendering the attributes
      function applyLegend(ID, layer_name){
        var legend = new Legend({
          map : self.map,
          layerInfos : [{
              layer : self.map.getLayer(ID[0]),
              title : layer_name[0]
          }]
        }, domConstruct.create("div", { class:"attr_legend" }, dom.byId("legendWrapper")));
        legend.startup();
      }

      function errorHandler(err) {
        // console.log("error: ", JSON.stringify(err));
      }

      function toggleAttributeValues(renderer, ID, layerName){
        var attr_value;
        var CheckedMultiSelect;

        // Create Container to hold all check boxes
        var valueContainer = domConstruct.create("div", { id: "valueContainer", class:"valueContainer" }, dom.byId("valueWrapper"));

        // Check if attribute values are numerical 
        if(selectedAttribute.isBreak == false){

          //Create button to toggle filter
          var checkBtn = domConstruct.create("div", { innerHTML:"Filter Value", id: "checkBoxContainerButton", class:"checkBoxContainerButton" }, valueContainer);
          var checkContainer = domConstruct.create("div", { id: "checkBoxContainer", class:"checkBoxContainer" }, valueContainer);
          domStyle.set(checkContainer, "display", "none");

          //Set onclick event callback for category button
          on(checkBtn, 'click', function(evt){
            checkBtn.classList.toggle("active");
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
            domConstruct.create("div", {  id: "checkBoxInput"+index, class:"checkBoxInput" }, checkContainer);
            domConstruct.create("div", {  id: "checkBox"+index, class:"checkBox" }, dom.byId("checkBoxInput"+index));

            //Create checkbox with default checked
            var checkBox = new CheckBox({
              name: attr_value,
              value: attr_color,
              checked: true,
              onChange: function(){ 
                if(!this.checked){
                  renderer.removeValue(this.name);
                  reapplyRenderLegend(renderer, ID, layerName, false);
                }
                else{
                  renderer.addValue(this.name, new SimpleFillSymbol().setColor(new Color(this.value)));
                  reapplyRenderLegend(renderer, ID, layerName, false);
                }
              }
            },domConstruct.create("div", null, dom.byId("checkBox"+index)));

            domConstruct.create("label", {  innerHTML: attr_value, class:"checkBoxLabel" }, dom.byId("checkBoxInput"+index));
            var symbol = domConstruct.create("div", { class:"symbol" }, dom.byId("checkBoxInput"+index));
            domStyle.set(symbol, "background", new Color(attr_color).toHex());
            domConstruct.create("br", null, dom.byId("checkBoxContainer"));
          }
        }
        else{
          // Get max numerical value and amount of discrete levels
          var max = selectedAttribute.Render_style[selectedAttribute.Render_style.length-1].To;
          var discreteVal = selectedAttribute.Render_style.length
          var labelArr = [];

          // Form Label value array
          for(value = 0; value < discreteVal + 1; value++){
            var displayAmt = value * (max/(discreteVal));
            var displayStr = Math.round(displayAmt);
            if(displayAmt >= 1000){
              displayStr = (displayAmt/1000) + "K";
            }
            if(displayAmt >= 1000000){
              displayStr = (displayAmt/1000000) + "M";
            }
            labelArr.push(displayStr);
          }

          // Create div to hold slider for styling
          var sliderContainer = domConstruct.create("div", {  id: "sliderInput", class:"sliderInput" }, valueContainer);

          var slider = new HorizontalSlider({
            name: "slider",
            value: max,
            minimum: 0,
            maximum: max,
            discreteValues: discreteVal + 1,
            intermediateChanges: true,
            style: "width: 100%;",
            onChange: function(){
              renderer.clearBreaks();
              for(index = 0; index < selectedAttribute.Render_style.length; index ++){
                var attr = selectedAttribute.Render_style[index];
                var field_symbol= new SimpleFillSymbol();
                field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0,0.7]), 0.5));
                field_symbol.setColor(new Color(attr.color));
                if(this.value > attr.From){
                  renderer.addBreak(attr.From, attr.To, field_symbol);
                }
              }
              reapplyRenderLegend(renderer, ID, layerName, true);
            }
          }, domConstruct.create("div", null, sliderContainer));

          //Create div to hold label markers for styling
          var labelContainer = domConstruct.create("div", {  id: "sliderLabelInput", class:"sliderLabelInput" }, valueContainer);

          var sliderRules = new HorizontalRule({
            container: "bottomDecoration",
            count: discreteVal + 1,
            style: "height: 5px; margin: 0 12px;"
          }, domConstruct.create("div", null, labelContainer));  

          //Create div to hold numeric labels for styling
          var labelContainer2 = domConstruct.create("ol", {  id: "sliderLabelInput2", class:"sliderLabelInput2" }, valueContainer);

          var sliderLabels = new HorizontalRuleLabels({
            container: "bottomDecoration",
            labels: labelArr,
            labelStyle: "font-size: 0.75em",
            style: "height: 1em; font-weight: bold;"
          }, domConstruct.create("div", null, labelContainer2));
        }
      }

      function reapplyRenderLegend(renderer, ID, layerName, check){
        domConstruct.empty("legendWrapper");
        self.map.getLayer(ID).setRenderer(renderer);
        self.map.getLayer(ID).redraw();
        if(check){
          applyLegend(ID,layerName);
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
   

    onOpen: function(){
      // console.log('onOpen');
    },

    onClose: function(){
      // if(currentLayer != null){
      //   self.map.removeLayer(currentLayer);
      //   currentLayer = null;
      // }
      // console.log('onClose');
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