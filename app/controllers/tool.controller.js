'use strict';

angular.module('bib.controllers')
.controller('ToolCtrl', function($scope, leafletMarkerEvents, leafletMapEvents, leafletData,
  mapService, fileService, autocompleteService, searchService) {
  // to fix reload page to load map when changing page
  var test = JSON.parse(localStorage.getItem('loadingPage'));
  if (!test) {
    localStorage.setItem('loadingPage', true);
    window.location.reload();
  }

  // Add the current timestamp in second to force the data update, no cache
  var url = './data/data.json?ver=' + Math.floor(Date.now() / 1000);

  autocompleteService.get().then(function (words) {
    $scope.allWords = words;
  });

  // Load Data & init business logic
  fileService
    .get(url)
    .then(function(result) {
      $scope.result = result;

      $scope.centersSearch = [];
      _.forIn($scope.result.allCenters, function(v) {
        $scope.centersSearch.push(v);
      });

      $scope.allMarkers = mapService.createMarkers(result.allCenters);

      // create list for first renderer
      $scope.allCenters = [];

      // use filter on allMarkers, don't mute allMarkers, allCenters
      // create immutable list as reference data
      var immutableAllCenters = [];
      _.forIn($scope.result.allCenters, function(v) {
        if (v.administration) {
          v.administration['Adresse(s)'] = v.administration['Adresse(s)'].replace(/\n/g, '').split(';');
          $scope.allCenters.push(v);
          immutableAllCenters.push({ center: v });
        }
      });

      // keep the place of center in list
      $scope.keyInList = {};
      _.forEach($scope.allCenters, function(v, k) {
        var id = v.administration['id'].trim();
        id = id.replace(/ /g, '');
        $scope.keyInList[id] = k;
      });

      // if no word in input display allcenters
      if (!$scope.filterSearch) {
        $scope.allCenters = immutableAllCenters;
        $scope.filtersOn = false;
      }

      /*
       * All functions used in view
       */

      // all Words in search in lowercase
      $scope.startsWith = function(state, viewValue) {
        return state.substr(0, viewValue.length).toLowerCase() === viewValue.toLowerCase();
      };

      // reset all filters : list, map, navigation, center displayed
      $scope.resetFilter = function() {
        $scope.filterSearch = '';

        // reset selection in list
        $scope.idSelectedCenter = null;

        // close popup
        leafletData.getMap().then(function(map) {
          map.closePopup();
        });

        if ($scope.filtersOn) {
          $scope.allCenters = immutableAllCenters;

          // center details
          $scope.centerActive = false;
          $scope.filtersOn = false;

          // get allCenters
          var listCentersFiltered = {};
          _.forIn($scope.result.allCenters, function(v, k) {
            listCentersFiltered[k] = v;
          });

          $scope.allMarkers = mapService.createMarkers(listCentersFiltered);

          updateMapFromList();
        }
      };

      // sort list by input search
      $scope.showNameChanged = function(word) {
        if (!$scope.filterSearch) {
          $scope.allCenters = immutableAllCenters;
          $scope.filtersOn = false;
          $scope.centerActive = false;
        }

        if ($scope.filterSearch || word) {
          if (word)
            $scope.filterSearch = word;
          $scope.centerActive = true;
          $scope.filtersOn = true;
          var searchResult = searchService.search($scope.filterSearch);
          var resultWithPath = [];
          var updateMarkers = [];

          // split slug
          _.forEach(searchResult, function(d) {
            if (d) {
              var searchPath = d.ref.split('_');
              var tab = searchPath[1] === 'personnel' || searchPath[1] === 'administration'
                ? 'description administrative' : searchPath[1];

              resultWithPath.push({
                id: searchPath[0],
                tab: tab,
                prop: searchPath[2]
              });
              updateMarkers.push(searchPath[0]);
            }
          });

          // manage multiple results for one center
          resultWithPath = _.groupBy(resultWithPath, 'id');

          // aggregate search result and center
          var resultWithPathBis = [];
          _.forIn(resultWithPath, function(v, k) {
            resultWithPathBis.push({ center: $scope.result.allCenters[k], search: v });
          });

          // bind center result to scope (list)
          $scope.allCenters = resultWithPathBis;

          // create index of center in list -> create a function -> service
          $scope.keyInList = {};
          _.forEach($scope.allCenters, function(v, k) {
            if (v)
              $scope.keyInList[v.search[0].id] = k;
          });

          // recreate list ?
          var listCentersFiltered = {};
          _.forEach(updateMarkers, function(d) {
            listCentersFiltered[d] = $scope.result.allCenters[d];
          });

          // recreate allMarkers, maybe filtered ?
          $scope.allMarkers = mapService.createMarkers(listCentersFiltered);

          updateMapFromList();
        }
      };

      // update map from list
      function updateMapFromList() {
        $scope.centerActive = false;
        angular.extend($scope, {
          center: {
            lat: 46.22545288226939,
            lng: 3.3618164062499996,
            zoom: 2
          },
          markers: $scope.allMarkers,
          position: {
            lat: 51,
            lng: 0,
            zoom: 6
          },
          events: { // or just {} //all events
            markers: {
              enable: ['click', 'mouseover', 'mouseout'],
              logic: 'broadcast'
            }
          }
        });
      }

      function displayCenterByDefault(key, item, keyCenter) {
        // display tabs
        $scope.centerActive = true;
        //$scope.filtersOn = true;
        $scope.centerSelected = item;

        // display details center & tooltip on map
        mapService.displayCenterSelected(item, key, keyCenter, $scope);

        // updated navigation'centers buttons
        $('#myTab li').removeClass('active');
        $('.tab-pane').removeClass('active');
        $('.description').addClass('active');
      }

      // Select first center by default
      displayCenterByDefault(0, $scope.allCenters[0], 0);

      // active tabs
      $scope.displayCenter = function(key, item, keyCenter) {
        // display tabs
        $scope.centerActive = true;
        //$scope.filtersOn = true;
        $scope.centerSelected = item;

        // display details center & tooltip on map
        mapService.displayCenterSelected(item, key, keyCenter, $scope);
      };

      // desactive tabs
      $scope.centerDesactivate = function() {
        $scope.idSelectedCenter = null;
        updateMapFromList();
      };

      // display a specific tab
      $scope.openSpecificTab = function(item, keyCenter) {
        // open center details
        $scope.centerActive = true;

        var center = { center: $scope.result.allCenters[item.id] };

        // display center details
        mapService.displayCenterSelected(center, null, keyCenter, $scope);

        var tab = item.tab === 'description administrative' ? 'description' : item.tab;

        // active good tab
        $('#myTab li').removeClass('active');
        $('.tab-pane').removeClass('active');
        $('.' + tab).addClass('active');
      };

      // display map with markers choosen
      $scope.initMap = function() {
        mapService.setAllAdressActive($scope.allCenters);
        updateMapFromList();
      };

      $scope.zoomFrance = function() {
        angular.extend($scope, {
          center: {
            lat: 46.227638,
            lng: 2.213749,
            zoom: 6
          },
          markers: $scope.allMarkers,
          position: {
            lat: 51,
            lng: 0,
            zoom: 4
          },
          events: { // or just {} //all events
            markers: {
              enable: ['click', 'mouseover', 'mouseout'],
              logic: 'broadcast'
            }
          }
        });
      };

      // refresh list from zoom
      var mapEvents = leafletMapEvents.getAvailableMapEvents();
      for (var k in mapEvents) {
        var eventName = 'leafletDirectiveMap.' + mapEvents[k];
        $scope.$on(eventName, function(event) {
          if (event.name === 'leafletDirectiveMap.zoomstart' || event.name === 'leafletDirectiveMap.move') {
            var centersInMap = [];

            // get lat & lng of map
            leafletData.getMap().then(function(map) {

              // desactivate center selected
              $scope.idSelectedCenter = null;

              // close popup
              leafletData.getMap().then(function(map) {
                map.closePopup();
              });

              // get coordinate of map -> make function then a service
              var mapNorthEastLat = map.getBounds()._northEast.lat;
              var mapNorthEastLng = map.getBounds()._northEast.lng;
              var mapSouthWestLat = map.getBounds()._southWest.lat;
              var mapSouthWestLng = map.getBounds()._southWest.lng;

              // check if centers are between lat & lng of map
              _.forIn($scope.allMarkers, function(v, k) {
                if (v.lat <= mapNorthEastLat && mapSouthWestLat <= v.lat && mapSouthWestLng <= v.lng && v.lng <= mapNorthEastLng) {
                  centersInMap.push(k);
                }
              });

              // display number of marker/adress on map
              $scope.centersInMap = centersInMap.length;

              function inMap(adress) {
                return (adress.lat <= mapNorthEastLat && mapSouthWestLat <= adress.lat && mapSouthWestLng <= adress.lon && adress.lon <= mapNorthEastLng);
              }

              // create list of centers if no search
              if (!$scope.filtersOn) {
                $scope.allCenters = [];
                centersInMap.forEach(function(d) {
                  d = d.split('_');

                  var idCenter = d[0];
                  if ($scope.result.allCenters[idCenter]) {
                    // check if adress in map
                    _.map($scope.result.allCenters[idCenter].administration.adressesGeo, function(d) {
                      inMap(d) ? d.active = true : d.active = false;
                    });

                    $scope.allCenters.push({ center: $scope.result.allCenters[idCenter] });
                  }
                });
                // set list og centers
                $scope.allCenters = _.uniqBy($scope.allCenters, 'center');
              } else { // list of centers with search result
                // convert array to obj with center key
                var allCentersObj = {};

                // get id of centers in current list
                _.forEach($scope.allCenters, function(v) {
                  if (v) {
                    var id = v.center.administration.id.trim();
                    id = id.replace(/ /g, '');
                    allCentersObj[id] = v;
                  }
                });

                // get all id of center in map
                var allCenterIdSearch = [];
                centersInMap.forEach(function(d) {
                  d = d.split('_');
                  var idCenter = d[0];
                  allCenterIdSearch.push(idCenter);
                });

                // set on list of adress to keep only centers
                allCenterIdSearch = _.uniq(allCenterIdSearch);

                // select only center in map and display in list
                $scope.allCenters = [];
                _.forEach(allCenterIdSearch, function(d) {
                  // filter only adress on the map
                  $scope.allCenters.push(allCentersObj[d]);
                });

              }

              // create keyInList
              $scope.keyInList = {};
              _.forEach($scope.allCenters, function(v, k) {
                if (v) {
                  var id = v.center.administration['id'].trim();
                  id = id.replace(/ /g, '');
                  $scope.keyInList[id] = k;
                }
              });
            });
          }
        });
      }

      // display map with markers choosen
      angular.extend($scope, {
        markers: $scope.allMarkers,
        center: {
          lat: 46.22545288226939,
          lng: 3.3618164062499996,
          zoom: 2
        },
        position: {
          lat: 51,
          lng: 0,
          zoom: 4
        },
        events: { // or just {} //all events
          markers: {
            enable: ['click', 'mouseover', 'mouseout'],
            logic: 'broadcast'
          }
        }
      });
    });

  /*
   * Map Interactions
   */

  // default map settings
  angular.extend($scope, {
    center: {
      lat: 46.22545288226939,
      lng: 3.3618164062499996,
      zoom: 2
    },
    layers: {
      baselayers: {
        osm: {
          name: 'OpenStreetMap',
          url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          type: 'xyz'
        }
      }
    }
  });

  // to reload map when page changing
  if (!$scope.$$phase) {
    $scope.$apply();
  }

  // add custom legend
  leafletData.getMap().then(function(map) {
    var MyControl = L.Control.extend({
      options: {
        position: 'bottomleft'
      },
      onAdd: function() {
        // create the control container with a particular class name
        var container = L.DomUtil.create('div', 'my-custom-control');
        container.innerHTML = '<svg width="250" height="150"> ' + '<text x="15" y="100" fill="black" font-size="14">Nombre de chercheurs permanents</text>' + '<rect width="30" height="30" x="105" y="110" fill="#e74c3c" />' + '<text x="130" y="150" fill="black">+ 80</text>' + '<rect width="30" height="30" x="75" y="110" fill="#d35400" />' + '<text x="100" y="150" fill="black">80</text>' + '<rect width="30" height="30" x="45" y="110" fill="#e67e22" />' + '<text x="70" y="150" fill="black">40</text>' + '<rect width="30" height="30" x="15" y="110" fill="#f1c40f" />' + '<text x="40" y="150" fill="black">20</text>' + '</svg>';
        return container;
      }
    });
    map.addControl(new MyControl());
  });

  // catch map events
  $scope.events = {
    markers: {
      enable: leafletMarkerEvents.getAvailableEvents(),
    }
  };

  var markerEvents = leafletMarkerEvents.getAvailableEvents();

  // detect event on markers and display or close popup
  for (var k in markerEvents) {
    var eventName = 'leafletDirectiveMarker.' + markerEvents[k];
    $scope.$on(eventName, function(event, args) {
      $scope.eventDetected = event.name;

      if ($scope.eventDetected === 'leafletDirectiveMarker.click') {
        // open popup
        args.leafletEvent.target.openPopup();

        // hightlight center in list
        var centerId = args.leafletEvent.target.options.id;
        centerId = centerId.split('_')[0];
        $scope.idSelectedCenter = $scope.keyInList[centerId];

        // save position in list
        var key = $scope.idSelectedCenter;
        $scope.key = key;

        // display center details -> need keycenter
        mapService.displayCenterSelected($scope.allCenters[key], null, key, $scope);

        // display center in list
        $('#listCenters').scrollTo($('.' + key));
      }

      if ($scope.eventDetected === 'leafletDirectiveMarker.mouseover') {
        args.leafletEvent.target.openPopup();
      }

      if ($scope.eventDetected === 'leafletDirectiveMarker.mouseout') {
        args.leafletEvent.target.closePopup();
      }
    });
  }
});
