var layerExtentConfig =
{
    "URL": "https://services2.arcgis.com/4WiMNWDUQZIvdL5U/ArcGIS/rest/services/SadiqueDemoMap/FeatureServer/1",
    "scale": 700
}

function getLayerURL(){
  return layerExtentConfig.URL;
}

function getLayerScale(){
  return layerExtentConfig.scale;
}
