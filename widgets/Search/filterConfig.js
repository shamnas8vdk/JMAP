var queryConfig =
{
  layers:[
    {
    "URL": "https://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/2",
    "attributes": ['objectid','name'],
    "name": "Recreation",
    "placeholder": "Enter Recreation",
    "suggestionTemplate": "${objectid}, ${name}", // Name: ${name} will look like Name: Wyoming
    "maxResults": 1000,
    "maxSuggestions": 1000
    },
    {
      "URL": "https://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/0",
      "attributes": ['objectid','facility'],
      "name": "Recreation2",
      "placeholder": "Enter Recreation2",
      "suggestionTemplate": "${objectid}, ${facility}",
      "maxResults": 1000,
      "maxSuggestions": 1000
    },
    {
      "URL": "https://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1",
      "attributes": ['objectid','trailtype'],
      "name": "Recreation3",
      "placeholder": "Enter Recreation3",
      "suggestionTemplate": "${objectid}, ${trailtype}",
      "maxResults": 1000,
      "maxSuggestions": 1000
    }
  ]
}

function getQueryLayers(){
  return queryConfig.layers;
}