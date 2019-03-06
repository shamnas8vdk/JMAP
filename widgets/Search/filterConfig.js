var queryConfig =
{
    "URL": "https://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/2",
    "attributes": ['objectid','name'],
    "name": "Recreation",
    "suggestionTemplate": "${objectid}, ${name}" // Name: ${name} will look like Name: Wyoming
}

function getLayerURL(){
  return queryConfig.URL;
}

function getQueryAttributes(){
  return queryConfig.attributes;
}

function getQueryName(){
  return queryConfig.name;
}

function getQuerySuggestionTemplate(){
    return queryConfig.suggestionTemplate;
  }