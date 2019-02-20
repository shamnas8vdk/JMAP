///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'jimu/BaseWidget',
    'dojo/_base/html',
    'dojo/on',
    './levelViewer',
    './building',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/GeometryService',
    'esri/tasks/BufferParameters'
  ],
  function(declare, lang, BaseWidget, html, 
    on, levelViewer, building, Query, QueryTask, 
    GeometryService, BufferParameters) {
    var clazz = declare([BaseWidget], {
      name: 'ZoomSlider',

      baseClass: 'jimu-widget-zoomslider',

      _disabledClass: 'jimu-state-disabled',
      _verticalClass: 'vertical',
      _horizontalClass: 'horizontal',
      _floatClass: 'jimu-float-leading',
      _cornerTop: 'jimu-corner-top',
      _cornerBottom: 'jimu-corner-bottom',
      _cornerLeading: 'jimu-corner-leading',
      _cornerTrailing: 'jimu-corner-trailing',

      moveTopOnActive: false,

      postCreate: function(){
        this.inherited(arguments);
        this.own(on(this.map, 'zoom-end', lang.hitch(this, this._zoomHandler)));
        this.own(on(this.map, 'extent-change', lang.hitch(this, this.levelCheck)));
        // this.map.on("extent-change", this.levelCheck(this.map.geographicExtent));extent-change
        this.btnZoomIn.title = window.jimuNls.common.zoomIn;
        this.btnZoomOut.title = window.jimuNls.common.zoomOut;
      },

      setPosition: function(position){
        this.inherited(arguments);
        if(typeof position.height === 'number' && position.height <= 30){
          this._setOrientation(false);
        }else{
          this._setOrientation(true);
        }
      },

      _zoomHandler: function(){
        html.removeClass(this.btnZoomIn, this._disabledClass);
        html.removeClass(this.btnZoomOut, this._disabledClass);
        var level = this.map.getLevel();
        var disabledButton = null;
        if(level > -1){
          if(level === this.map.getMaxZoom()){
            disabledButton = this.btnZoomIn;
          }else if(level === this.map.getMinZoom()){
            disabledButton = this.btnZoomOut;
          }
        }
        if(disabledButton){
          html.addClass(disabledButton, this._disabledClass);
        }
      },

      //Check if map is centered at a single feature
      levelCheck: function(){
        // Get URL and form new query
        var URL = getLayerURL();
        var queryTask = new QueryTask(URL);
        var queryParams = new Query();
        var ext = this.map.geographicExtent;
        var current = this;
        queryParams.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
        queryParams.geometry = ext;
        queryParams.returnGeometry = true;
        queryParams.outFields = ['*'];
        queryParams.outSpatialReference = this.map.spatialReference;

        // Compare scale to be valid before executing query
        if(getLayerScale() > this.map.getScale()){
          queryTask.executeForCount(queryParams,function(result){
            if(result==1){
              // Create the level widget only if 1 feature is inside extent
              createList();
              // current.getCenterPointGeometry();
            }
            else{
              removeList();
            }
          });
        }
      },

      // Get feature from centerpoint of map
      getCenterPointGeometry: function(){
        // Get URL and form new query
        var URL = getLayerURL();
        var queryTask = new QueryTask(URL);
        var queryParams = new Query();
        var mapPoint = this.map.geographicExtent.getCenter();

        // Use within to find the feature mapPoint is within
        queryParams.spatialRelationship = Query.SPATIAL_REL_WITHIN;
        queryParams.geometry = mapPoint;
        queryParams.returnGeometry = true;
        queryParams.outFields = ['*'];
        queryParams.outSpatialReference = this.map.spatialReference;

        queryTask.execute(queryParams,function(result){
          if(result.features.length > 0){
            // Do Something here
          }
        });
      },

      _onBtnZoomInClicked: function(){
        this.map._extentUtil({ numLevels: 1});
      },

      _onBtnZoomOutClicked: function(){
        this.map._extentUtil({ numLevels: -1});
      },

      _setOrientation: function(isVertical){
        html.removeClass(this.domNode, this._horizontalClass);
        html.removeClass(this.domNode, this._verticalClass);

        html.removeClass(this.btnZoomIn, this._floatClass);
        html.removeClass(this.btnZoomIn, this._cornerTop);
        html.removeClass(this.btnZoomIn, this._cornerLeading);

        html.removeClass(this.btnZoomOut, this._floatClass);
        html.removeClass(this.btnZoomOut, this._cornerBottom);
        html.removeClass(this.btnZoomOut, this._cornerTrailing);

        if(isVertical){
          html.addClass(this.domNode, this._verticalClass);
          html.addClass(this.btnZoomIn, this._cornerTop);
          html.addClass(this.btnZoomOut, this._cornerBottom);
        }else{
          html.addClass(this.domNode, this._horizontalClass);
          html.addClass(this.btnZoomIn, this._floatClass);
          html.addClass(this.btnZoomOut, this._floatClass);
          html.addClass(this.btnZoomIn, this._cornerLeading);
          html.addClass(this.btnZoomOut, this._cornerTrailing);
        }
      },

      _buildLevelInformation: function(){

      }

    });
    return clazz;
  });