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
         'dojo/_base/array',
         'dijit/form/FilteringSelect',
         'dojo/dom-construct',
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
         arrayUtils,
         FilteringSelect,
         domConstruct,
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
            fieldNames.items.push({ "name": selectedLayer.Attributes[attributeIndex].Display_Name, "value": attribute.name });
            attributeIndex++;
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
            domConstruct.empty("legendWrapper");

            // Render CSS Styles of map on change with getData
            if(index != 0){
              selectedAttribute = selectedLayer.Attributes[index-1];
              fieldSelect.on("change", getData(this.item.value[0],URL[0], ID, layer_name));
            }
          } 
       }, domConstruct.create("div", { class:"selectBox" }, dom.byId("fieldWrapper")));
      }, function(err) {
        // console.log("failed to get field names: ", err);
      });

      function getData(field,URL,ID, layer_name) {
        // Apply Render
        applyRenderer(field,URL,ID, layer_name)
      }

      function applyRenderer(field, URL, ID, layer_name) {

        // Get Layer and attribute render information according to URL
        var renderStyle;
        var renderer;
        var isBreak;
        var defaultSymbol
        var attr_name;

        // Get render styles of the selected attribute
        // arrayUtils.forEach(layerConfig.layers, function(layer) {
        //   if(layer.URL == URL){
        //     arrayUtils.forEach(layer.Attributes, function(attribute) {
        //       if(attribute.Name == field){
        //         renderStyle = attribute.Render_style;
        //         isBreak = attribute.isBreak;
        //         attr_name = attribute.Name;
        //       }
        //     })
        //   }
        // })

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
            // field_symbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color(renderStyle[index].color), 2));
            renderer.addBreak(renderStyle[index].From, renderStyle[index].To, field_symbol);
          }
        }
        else{
          var defaultSymbol = new SimpleFillSymbol().setColor(new Color([127, 127, 127, 0.5]));
          renderer = new UniqueValueRenderer(defaultSymbol, field);

          // Loop through styles of attribute, make sure they exists in the styles of the chosen attribute
          for(index = 1; index < renderStyle.length; index++){
            renderer.addValue(renderStyle[index].Name, new SimpleFillSymbol().setColor(new Color(renderStyle[index].color)));
          }
        }

      // Add five breaks to the renderer.
      // If you have ESRI's ArcMap available, this can be a good way to determine break values.
      // You can also copy the RGB values from the color schemes ArcMap applies, or use colors
      // from a site like www.colorbrewer.org
      //
      // alternatively, ArcGIS Server's generate renderer task could be used
      // var renderer = new ClassBreaksRenderer(symbol, "POP07_SQMI");
      // renderer.addBreak(0, 25, new SimpleFillSymbol().setColor(new Color([56, 168, 0, 0.5])));
      // renderer.addBreak(25, 75, new SimpleFillSymbol().setColor(new Color([139, 209, 0, 0.5])));
      // renderer.addBreak(75, 175, new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.5])));
      // renderer.addBreak(175, 400, new SimpleFillSymbol().setColor(new Color([255, 128, 0, 0.5])));
      // renderer.addBreak(400, Infinity, new SimpleFillSymbol().setColor(new Color([255, 0, 0, 0.5])));

        // Apply to map and startup legend
        self.map.getLayer(ID).setRenderer(renderer);
        self.map.getLayer(ID).redraw();
        applyLegend(ID,layer_name);
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