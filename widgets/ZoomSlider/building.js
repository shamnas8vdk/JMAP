var layerExtentConfig =
{
    "URL": "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3",
    "scale": 73957190
}

function getLayerURL(){
  return layerExtentConfig.URL;
}

function getLayerScale(){
  return layerExtentConfig.scale;
}
