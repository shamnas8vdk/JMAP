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
         'esri/layers/LayerDrawingOptions' ,
         'esri/symbols/SimpleLineSymbol',
         'esri/renderers/UniqueValueRenderer'   
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
         FeatureLayer,
         LayerDrawingOptions,
         SimpleLineSymbol,
         UniqueValueRenderer) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,
    
    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      var app = {};
      self = this;
      app.defaultFrom = "#ffffcc";
      app.defaultTo = "#006837";
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      console.log(this.map);
      // get field info
      debugger;
    //   var layer = new FeatureLayer("https://services1.arcgis.com/6txKVziKkZ2VHz7Z/ArcGIS/rest/services/processed_Farm_land/FeatureServer/0", {
    //     "id": "Washington",
    //  });
    //  self.map.addLayer(layer);

    // ----------- Junwei authored the below section ------ //
    //Get JSON data of layers with AJAX
    $.getJSON( getJSONPath(), function( data ){

      // Declare object to store layer names in layerNames and store them in layerStore
      var layerNames, layerStore;
      layerNames = { identifier: "value", label: "name", items: [] };
      arrayUtils.forEach(data.layers, function(f) { 
        // Store List of attributes for each layer into array
        var attributes = [];
        arrayUtils.forEach(f.Attributes, function(g) {
          attributes.push(g.Name);
        })
        // Push information into array for storage in Filtering Select Object
        layerNames.items.push({ "name": f.Name, "value": f.Name, "width": f.Dropdown_style.width, 
        "fontSize": f.Dropdown_style.fontSize, "color": f.Dropdown_style.color,"attributes": attributes, "URL": f.URL});
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
          "width": layerNames.items[0].width,
          "fontSize": layerNames.items[0].fontSize,
          "color": layerNames.items[0].color
      },
      onChange: function(){
        // Get selected index and toggle to show attributes of selected layer
        var index = this.item._0;
        domConstruct.empty("fieldWrapper");
        toggleAttributeFields(layerNames.items[index].attributes, layerNames.items[index].URL, 
          layerNames.items[index].width, layerNames.items[index].fontSize, layerNames.items[index].color);
      } 
      },domConstruct.create("div", null, dom.byId("layerWrapper")));
    });

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

    // Display dropdown of all attributes and set render styles
    function toggleAttributeFields(attributes, URL, width, font, color){
      // Create new "div" element for innerHTML label
      domConstruct.create("div", { innerHTML: "Currently selected attribute" }, dom.byId("fieldWrapper"));

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
        fieldNames = { identifier: "value", label: "name", items: [] };
        for(attrIndex = 0; attrIndex < attributes.length; attrIndex++){
          fieldNames.items.push({ "name": attributes[attrIndex], "value": attributes[attrIndex] });
        }
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
            // Render CSS Styles of map on change with getData
            fieldSelect.on("change", getData(this.item.name[0],URL[0]));
          } 
       }, domConstruct.create("div", null, dom.byId("fieldWrapper")));
      }, function(err) {
        console.log("failed to get field names: ", err);
      });

      function getData(field,URL) {
        // Apply Render
        applyRenderer(field,URL)
      }

      function applyRenderer(field,URL) {
        // Get Layer and attribute render information according to URL
        $.getJSON( getJSONPath(), function( data ){
          var renderStyle;
          arrayUtils.forEach(data.layers, function(layer) {
            if(layer.URL == URL){
              arrayUtils.forEach(layer.Attributes, function(attribute) {
                if(attribute.Name == field){
                  renderStyle = attribute.Render_style;
                }
              })
            }
          })

          // Render default style of map
          var defaultSymbol = new SimpleFillSymbol().setColor(new Color(renderStyle[0].color));
          var renderer = new UniqueValueRenderer(defaultSymbol, field);

          // Loop through styles of attribute and add to renderer
          for(index = 1; index < renderStyle.length; index++){
            console.log(renderStyle[index].Name + " " +renderStyle[index].color)
            renderer.addValue(renderStyle[index].Name, new SimpleFillSymbol().setColor(new Color(renderStyle[index].color)));
          }

          // Apply to map
          self.map.getLayer("processed_Farm_land_7151").setRenderer(renderer);
          self.map.getLayer("processed_Farm_land_7151").redraw();
        })    
      }
      function errorHandler(err) {
        // console.log("Something broke, error: ", err);
        console.log("error: ", JSON.stringify(err));
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
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    showVertexCount: function(count){
      //this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    }
  });
});