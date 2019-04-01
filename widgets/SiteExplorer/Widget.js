define(['dojo/_base/declare',
        'jimu/BaseWidget', 
        "dojo/_base/array",
        "esri/Color",
        "esri/map",
        "esri/geometry/Extent",
        "dojo/on",
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/graphic"
    ],
function(declare, 
        BaseWidget,
        arrayUtils,
        Color,
        Map,
        Extent,
        on,
        Query,
        QueryTask,
        SimpleFillSymbol,
        SimpleLineSymbol,
        GraphicClass
        ) {
        
        var mapClick;
        var app;
        var resultsArray;

  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-siteExplorer',
    currentLayer: null,

    postCreate: function() {
      this.inherited(arguments);
    },

    startup: function() {
      this.inherited(arguments);    
    },

    onOpen: function(){
      app = {};
      //var self =this;
      app.map = this.map;
      var Graphic = GraphicClass;
      app.map.graphics.clear();
      console.log("On Open");
      console.log(resultsArray);

      // initialise query params
      
      //initialise symbols
      var highlightSymbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([255,0,0]), 3
        ),
        new Color([125,125,125,0.35])
      );
      

      mapClick = on(map, "click", executeQuery);

      function executeQuery(e) {
        app.qBuffer = new Query();
        app.qBuffer.returnGeometry =  true;
        //this.map 
        var map, qtBuffer, qBuffer;
        resultsArray = [];
        var outFields = [];
        // viz = this.vizQueryResults;

        // initialise query params
        app.qBuffer.geometry = e.mapPoint;
        //loop through json
        $.getJSON(getJSONPath()).then(function(path) { 
          app.qtBuffer = new QueryTask(path.primaryLayer[0].url);
          app.qtBuffer.execute(app.qBuffer).then(function(data){
            app.qBuffer.geometry = data.features[0].geometry;
            path.layers.forEach(function(element,index) {
              app.qBuffer.orderByFields = [element.order_field]; // grab order by field
              app.qtBuffer = new QueryTask(element.url); // set url of query
              
              //initialise outfields from json 
              //empty after every cycle
              outFields = [];
              element.attributes.forEach(function(e) {
                outFields.push(e.Name);
              });
              app.qBuffer.outFields = outFields; //set outfields

              //execute query and push data to results array
              app.qtBuffer.execute(app.qBuffer).then(function(data){
                resultsArray.push(data);
                // once query completed - visualise it
                if(index==(path.layers.length-1)) {
                  vizQueryResults(resultsArray);  
                }
              });
            })
          });            
        }); 
        //results of query
        console.log(resultsArray);
      }
      function vizQueryResults(results) {
        var highlightGraphic;
        // clear graphics after every click
        app.map.graphics.clear();
        //loop through results in resultArray
        results.forEach(function(feat) {
          //loop through features for each result and grab geometry
          feat.features.forEach(function(geom) {
            //highlight features
            var highlightGraphic = new Graphic(geom.geometry, highlightSymbol);
            // console.log(highlightGraphic);
            app.map.graphics.add(highlightGraphic);
          });
        });        
      }

      //Obtain JSON file of widget dynamically
      function getJSONPath() {
        var JSONPath;
        JSONPath = window.location.href + "widgets/SiteExplorer/layer.json";
        return JSONPath;
      }
    },

    onClose: function(){
      //remove click | clear graphics | empty resultsArray
      mapClick.remove();
      app.map.graphics.clear();
      resultsArray = [];
      console.log('onClose');
      //how to close this function properly?
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
    }
  });
});
