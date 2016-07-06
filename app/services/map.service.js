angular.module('map.service', [])
  .factory('mapService', function() {

    return {
        createMarkers: function (v, allMarkers) {
            function fixIconSize(v) {
                var personnelSize;

                if (v.personnel['Personnels permanents'] <= 20)
                    personnelSize = 'small';
                else if (v.personnel['Personnels permanents'] > 20 
                    && v.personnel['Personnels permanents'] <= 40)
                    personnelSize = 'medium';
                else if (v.personnel['Personnels permanents'] > 40 
                    && v.personnel['Personnels permanents'] <= 80)
                    personnelSize = 'large';
                else 
                    personnelSize = 'extraLarge';

                return personnelSize;
            }

            if (v && v.administration)
                if (v.administration.adressesGeo)
                    v.administration.adressesGeo.forEach(function(a, i) {                       
                        if (v.administration['Sigle ou acronyme'].indexOf('-') > -1) {
                            v.administration['Sigle ou acronyme'] = v.administration['Sigle ou acronyme'].replace(/-/g, '_');
                        }

                        // set size & color marker
                        var iconSize = 10,
                            colorMarker = fixIconSize(v);

                        // create class for principal or secondaire adress (carre ou cercle)
                        var local_icons = {
                            principal: {
                                type: 'div',
                                iconSize: [iconSize, iconSize],
                                html: '<div></div>',
                                className: colorMarker,
                                popupAnchor:  [0, -10]
                            }
                        }
                        
                        // clean id
                        var id = v.administration['id'].trim();
                        id = id.replace(/ /g, '');
                        id = id.replace(/;/g, '');
                        id = id.replace(/\n/g, '');
                        id = id.replace(/_/g, '');

                        //create message for the popup
                        var message = v.administration['Sigle ou acronyme'] + ' - ' + v.administration['Intitulé'];

                        // create one marker by adress and one cluster by city
                        allMarkers[id + '_' + i] = {
                            group: 'France', //city or France
                            lat: a.lat,
                            lng: a.lon,
                            message: message,
                            icon: local_icons.principal,
                            focus: false,
                            id: id + '_' + i
                        };

                    })
        },
        displayCenterSelected: function (item, key, $scope, leafletData, $sce) {
            // display details of center                    
            $scope.centerActive = true;

            // convert markdown to html
            var converter = new Showdown.converter();

            // bind center's data to tabs
            if (item.center) {
                // bind markdown data
                $scope.administration = item.center.administration;
                $scope.personnel = item.center.personnel;
                $scope.ecole = item.center.ecole;
                $scope.recherche = item.center.recherche;
                $scope.annuaire = item.center.recherche['Mots-clés sujet selon l\'annuaire du MENESR'];
                $scope.disciplinePrincipale = item.center.recherche['Discipline principale selon l\'annuaire du MENESR']
                $scope.disciplineSecondaire = item.center.recherche['Disciplines secondaires selon l\'annuaire du MENESR']
                $scope.section = item.center.recherche['Sections CNRS'];
                
                // create axes
                var axes = ''
                if (Array.isArray(item.center.recherche['Axes de recherche'])) {
                    _.forEach(item.center.recherche['Axes de recherche'], function (d) {
                        axes = axes.concat(d) + ' \n';
                    });
                    $scope.axes = converter.makeHtml(axes)
                }
                else
                    $scope.axes = converter.makeHtml(item.center.recherche['Axes de recherche']);

                // create contrats
                var contrats = ''
                if (Array.isArray(item.center.recherche['Contrats de recherche'])) {
                    _.forEach(item.center.recherche['Contrats de recherche'], function (d) {
                        contrats = contrats.concat(d) + ' \n';
                    });
                    $scope.contrats = converter.makeHtml(contrats);
                }
                else
                    $scope.contrats = converter.makeHtml(item.center.recherche['Contrats de recherche']);

                // create seminaires
                var seminaires = ''
                if (Array.isArray(item.center.recherche['Séminaires de recherche'])) {
                    _.forEach(item.center.recherche['Séminaires de recherche'], function (d) {
                        seminaires = seminaires.concat(d) + ' \n';
                    });
                    $scope.seminaires = converter.makeHtml(seminaires);
                }
                else
                    $scope.seminaires = converter.makeHtml(item.center.recherche['Séminaires de recherche']);

                // create collaboration
                // create seminaires
                var collaboration = ''
                if (Array.isArray(item.center.recherche['Collaborations / réseaux'])) {
                    _.forEach(item.center.recherche['Collaborations / réseaux'], function (d) {
                        collaboration = collaboration.concat(d) + ' \n';
                    });
                    $scope.collaboration = converter.makeHtml(collaboration);
                }
                else
                    $scope.collaboration = converter.makeHtml(item.center.recherche['Collaborations / réseaux']);               
            }

            // highlight search in fulltxt
            $scope.highlight = function(text, search) {
                if (!search)
                    return $sce.trustAsHtml(text);
                return $sce.trustAsHtml(text.replace(new RegExp(search, 'gi'), '<span class="highlighted">$&</span>'));
            };

            // highlight center in list
            $scope.idSelectedCenter = key;
            //$("#listCenters").scroll($('#' + key));

            // open popup of center selected
            leafletData.getMap().then(function(map) {
                // display all adresses available
                var id_center = item.center.administration.id.replace(/ /g,"");
                var marker_keys = item.center.administration.adressesGeo.map(function(a,i) {
                    return id_center + '_' + i;
                });

                console.log("id_center", id_center);
                console.log("marker_keys", marker_keys);



                // create popup
                var showPopup = function(marker_key) {
                     console.log("popup,",marker_key,$scope.markers[marker_key])
                    var marker = $scope.markers[marker_key],
                        content = marker.message,
                        latLng = [marker.lat, marker.lng],
                        popup = L.popup({ className : 'custom-popup' }).setContent(content).setLatLng(latLng);
                   
                    leafletData.getMap().then(function(map) {
                    popup.openOn(map);
                    });

                }

                showPopup(id_center+'_'+key);

                // _.forEach(marker_keys, function(d) {
                //     showPopup(d);
                // });
            });   
        }
    }
})  







