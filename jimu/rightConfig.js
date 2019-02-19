var rights ={
    "layers": [
      {
        "right":"SadiqueLayer_Right",
        "layer_name":"SadiqueDemoMap",
        "layer_id":"SadiqueDemoMap_9776",
        "layer_url":"https://services2.arcgis.com/4WiMNWDUQZIvdL5U/ArcGIS/rest/services/SadiqueDemoMap/FeatureServer/1"
      }
    ],
    "widgets": [
      {
        "right":"Identify_Right",
        "widget_name":"Identify",
        "widget_uri":"widgets/Identify/Widget"
      },
      {
        "right":"Classification_Right",
        "widget_name":"Classification",
        "widget_uri":"widgets/Classification/Widget"
      }
    ]
}

function getRights(){
  return rights;
}

