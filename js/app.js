var markers = [];
var polygon = null;
var locations = [{
        title: 'G3s',
        location: {
            lat: 28.7344,
            lng: 77.1136
        },
        show: true,
        foursquare:'4d970b1f61a3a1cd0d58aa42'
    },
    {
        title: 'Swarn jayanti Park',
        location: {
            lat: 28.7231,
            lng: 77.1199
        },
        show: true,
        foursquare:'4d27ce5a467d6ea8c077c095'
    },
    {
        title: 'PVR prashant vihar',
        location: {
            lat: 28.7125,
            lng: 77.1359
        },
        show: true,
        foursquare:'4d29ff0d8292236acfcb27bb'
    },
    {
        title: 'metro walk mall',
        location: {
            lat: 28.7237,
            lng: 77.1135
        },
        show: true,
        foursquare:'4c0b3e6002c9d13a081774dd'
    },
    {
        title: 'M2K Cinema',
        location: {
            lat: 28.7009,
            lng: 77.1166
        },
        show: true,
        foursquare:'4bf6720dbb5176b004fa5ab2'
    },
];
//new model starts from here
var viewmodel = function() {
    var largeInfowindow = new google.maps.InfoWindow();
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    var bounds = new google.maps.LatLngBounds();
    var defaulticon = makeMarkerIcon('C1FD33');
    var highlightedicon = makeMarkerIcon('FFFF24');
    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            icon: defaulticon,
            animation: google.maps.Animation.DROP,
            id: i,
            show: ko.observable(true),
            venue:locations[i].foursquare,
            rating:'',
            image:''
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedicon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaulticon);
        });
        bounds.extend(markers[i].position);
    }

    document.getElementById('toggle-drawing').addEventListener('click', function() {
        toggleDrawing(drawingManager);
    });
    drawingManager.addListener('overlaycomplete', function(event) {
        // First, check if there is an existing polygon.
        // If there is, get rid of it and remove the markers
        if (polygon) {
            polygon.setMap(null);
            hideListings(markers);
        }
        // Switching the drawing mode to the HAND (i.e., no longer drawing).
        drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        polygon = event.overlay;
        polygon.setEditable(true);
        // Searching within the polygon.
        searchWithinPolygon();
        // Make sure the search is re-done if the poly is changed.
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });

    document.getElementById('search-within-time').addEventListener('click', function() {
        searchWithinTime();
    });
    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);

    //the marker which is selected open its pop up window
    this.selectAll = function(marker) {

        populateInfoWindow(marker, largeInfowindow);
        marker.selected = true;
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 500)
    };

    // This function populates the infowindow when the marker is clicked. We'll only allow
    // one infowindow which will open at the marker that is clicked, and populate based
    // on that markers position.
    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('<div>' + '<h3>' + marker.title + '</h3>' + "<h4>Ratings:" + marker.rating + '</h4> </div><div><img src="' + marker.image + '"></div>');
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.setMarker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);
        }
    }

    // This function will loop through the markers array and display them all.
    function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
            bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
    }


    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return markerImage;
    }

    function toggleDrawing(drawingManager) {
        if (drawingManager.map) {
            drawingManager.setMap(null);
            // In case the user drew anything, get rid of the polygon
            if (polygon !== null) {
                polygon.setMap(null);
            }
        } else {
            drawingManager.setMap(map);
        }
    }

    function searchWithinPolygon() {
        for (var i = 0; i < markers.length; i++) {
            if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
                markers[i].setMap(map);
            } else {
                markers[i].setMap(null);
            }
        }
    }


    function searchWithinTime() {
        // Initialize the distance matrix service.
        var distanceMatrixService = new google.maps.DistanceMatrixService;
        var address = document.getElementById('search-within-time-text').value;
        // Check to make sure the place entered isn't blank.
        if (address == '') {
            window.alert('You must enter an address.');
        } else {
            /*hideListings();*/
            // Use the distance matrix service to calculate the duration of the
            // routes between all our markers, and the destination address entered
            // by the user. Then put all the origins into an origin matrix.
            var origins = [];
            for (var i = 0; i < markers.length; i++) {
                origins[i] = markers[i].position;
            }
            var destination = address;
            var mode = document.getElementById('mode').value;
            // Now that both the origins and destination are defined, get all the
            // info for the distances between them.
            distanceMatrixService.getDistanceMatrix({
                origins: origins,
                destinations: [destination],
                travelMode: google.maps.TravelMode[mode],
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            }, function(response, status) {
                if (status !== google.maps.DistanceMatrixStatus.OK) {
                    window.alert('Error was: ' + status);
                } else {
                    displayMarkersWithinTime(response);
                }
            });
        }
    }
    // This function will go through each of the results, and,
    // if the distance is LESS than the value in the picker, show it on the map.
    function displayMarkersWithinTime(response) {
        var maxDuration = document.getElementById('max-duration').value;
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;
        // Parse through the results, and get the distance and duration of each.
        // Because there might be  multiple origins and destinations we have a nested loop
        // Then, make sure at least 1 result was found.
        var atLeastOne = false;
        for (var i = 0; i < origins.length; i++) {
            var results = response.rows[i].elements;
            for (var j = 0; j < results.length; j++) {
                var element = results[j];
                if (element.status === "OK") {
                    // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
                    // the function to show markers within a user-entered DISTANCE, we would need the
                    // value for distance, but for now we only need the text.
                    var distanceText = element.distance.text;
                    // Duration value is given in seconds so we make it MINUTES. We need both the value
                    // and the text.
                    var duration = element.duration.value / 60;
                    var durationText = element.duration.text;
                    if (duration <= maxDuration) {
                        //the origin [i] should = the markers[i]
                        markers[i].setMap(map);
                        atLeastOne = true;
                        // Create a mini infowindow to open immediately and contain the
                        // distance and duration
                        var infowindow = new google.maps.InfoWindow({
                            content: durationText + ' away, ' + distanceText +
                                '<div><input type=\"button\" value=\"View Route\" onclick =' +
                                '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
                        });
                        infowindow.open(map, markers[i]);
                        // Put this in so that this small window closes if the user clicks
                        // the marker, when the big infowindow opens
                        markers[i].infowindow = infowindow;
                        google.maps.event.addListener(markers[i], 'click', function() {
                            this.infowindow.close();
                        });
                    }
                }
            }
        }
        if (!atLeastOne) {
            window.alert('We could not find any locations within that distance!');
        }
    }


    this.showAll = function(variable) {
        for (i = 0; i < markers.length; i++) {
            markers[i].show(variable);
            markers[i].setVisible(variable);
        }
    };
    this.inputText = ko.observable('');
    this.filtersearch = function(Infowindow) {
        var inputSearch = this.inputText();
        console.log(inputSearch);
        if (inputSearch.length === 0) {
            this.showAll(true);
        } else {
            for (i = 0; i < markers.length; i++) {
                if (markers[i].title.toLowerCase().indexOf(inputSearch.toLowerCase()) > -1) {
                    markers[i].show(true);
                    markers[i].setVisible(true);
                } else {
                    markers[i].show(false);
                    markers[i].setVisible(false);
                }
            }
        }
        
    };

    // get rating for each marker
    markers.forEach(function(m) {
        //passing m for marker
        $.ajax({ //ajax request for foursquare api
            method: 'GET',
            dataType: "json",
            url: "https://api.foursquare.com/v2/venues/" + m.venue + "?client_id=Z1DURYHEOJZ21TP2SORW2GHFZQFGQ1RVVGG34DSJUNUSGRKV&client_secret=BHVCOE0PAP40WU4B5MU4M0OYMRV3RYH2VGGTSCLVPR4OJZM5&v=20170303",
            success: function(data) { //if data is successfully fetch than function will execute
                var venue = data.response.venue;
                var imgurl = data.response.venue.photos.groups[0].items[0];
                if ((venue.hasOwnProperty('rating')) || ((imgurl.hasOwnProperty('prefix')) && (imgurl.hasOwnProperty('suffix')))) {
                    
                    m.rating = venue.rating;
                    m.image = imgurl.prefix + "100x100" + imgurl.suffix;
                } else {
                    m.rating = '';
                    m.imgurl = '';
                }
            }
        });
    });

};



function openNav() {
    document.getElementById("mySidenav").style.width = "100vw";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
closeNav();