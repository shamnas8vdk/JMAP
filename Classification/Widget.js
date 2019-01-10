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
      var countyFields = esriRequest({
        url: 'https://services1.arcgis.com/6txKVziKkZ2VHz7Z/ArcGIS/rest/services/processed_Farm_land/FeatureServer/0',
        content: {
          f: "json"
        },
        callbackParamName: "callback"
      });
      countyFields.then(function(resp) {
        var fieldNames, fieldStore;

        fieldNames = { identifier: "value", label: "name", items: [] };
        arrayUtils.forEach(resp.fields.slice(0, 6), function(f) { // add some field names to the FS
          fieldNames.items.push({ "name": f.name, "value": f.name });
        });
        fieldStore = new ItemFileReadStore({ data: fieldNames });
        fieldSelect = new FilteringSelect({
          displayedValue: fieldNames.items[0].name,
          value: fieldNames.items[0].value,
          name: "fieldsFS",
          required: false,
          store: fieldStore,
          searchAttr: "name",
          style: {
             "width": "290px",
             "fontSize": "12pt",
             "color": "#444"
          }
       }, domConstruct.create("div", null, dom.byId("fieldWrapper")));
       fieldSelect.on("change", getData);
      }, function(err) {
        console.log("failed to get field names: ", err);
      });

      function getData(field) {
        //classBreaks(app.defaultFrom, app.defaultTo,field);
        applyRenderer(field)
      }
      function classBreaks(c1, c2,field) {
        debugger;
        var classDef = new ClassBreaksDefinition();
        classDef.classificationField = field;
        classDef.classificationMethod = "natural-breaks"; // always natural breaks
        classDef.breakCount = 5; // always five classes
  
        var colorRamp = new AlgorithmicColorRamp();
        colorRamp.fromColor = new Color.fromHex(c1);
        colorRamp.toColor = new Color.fromHex(c2);
        colorRamp.algorithm = "hsv"; // options are:  "cie-lab", "hsv", "lab-lch"
  
        classDef.baseSymbol = new SimpleFillSymbol("solid", null, null);
        classDef.colorRamp = colorRamp;
  
        var params = new GenerateRendererParameters();
        params.classificationDefinition = classDef;
        var generateRenderer = new GenerateRendererTask("https://services1.arcgis.com/6txKVziKkZ2VHz7Z/ArcGIS/rest/services/processed_Farm_land/FeatureServer/0");
        generateRenderer.execute(params, applyRenderer, errorHandler);
      }
      function applyRenderer(field) {
        // dynamic layer stuff
        var defaultSymbol = new SimpleFillSymbol().setColor(new Color([127, 127, 127, 0.5]));
        
        var renderer = new UniqueValueRenderer(defaultSymbol, field);
        renderer.addValue("Pineapple", new SimpleFillSymbol().setColor(new Color([255, 0, 0, 0.5])));
        renderer.addValue("Maize", new SimpleFillSymbol().setColor(new Color([0, 255, 0, 0.5])));
        renderer.addValue("Tea", new SimpleFillSymbol().setColor(new Color([0, 0, 255, 0.5])));
        renderer.addValue("Irrigated", new SimpleFillSymbol().setColor(new Color([255, 0, 255, 0.5])));
        renderer.addValue("Rainfed", new SimpleFillSymbol().setColor(new Color([255, 255, 255, 0.75])));
       
        self.map.getLayer("processed_Farm_land_7151").setRenderer(renderer);
        self.map.getLayer("processed_Farm_land_7151").redraw();
        // create the legend if it doesn't exist        
      }
      function errorHandler(err) {
        // console.log("Something broke, error: ", err);
        console.log("error: ", JSON.stringify(err));
      }
            
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