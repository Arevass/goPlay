function success(position) {
    var customMapType = new google.maps.StyledMapType(
    [
        {
            "featureType": "landscape",
            "stylers": [
                {
                    "hue": "#FFA800"
                },
                {
                    "saturation": 0
                },
                {
                    "lightness": 0
                },
                {
                    "gamma": 1
                }
            ]
        },
        {
            "featureType": "road.highway",
            "stylers": [
                {
                    "hue": "#53FF00"
                },
                {
                    "saturation": -73
                },
                {
                    "lightness": 40
                },
                {
                    "gamma": 1
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "stylers": [
                {
                    "hue": "#FBFF00"
                },
                {
                    "saturation": 0
                },
                {
                    "lightness": 0
                },
                {
                    "gamma": 1
                }
            ]
        },
        {
            "featureType": "road.local",
            "stylers": [
                {
                    "hue": "#00FFFD"
                },
                {
                    "saturation": 0
                },
                {
                    "lightness": 30
                },
                {
                    "gamma": 1
                }
            ]
        },
        {
            "featureType": "water",
            "stylers": [
                {
                    "hue": "#00BFFF"
                },
                {
                    "saturation": 6
                },
                {
                    "lightness": 8
                },
                {
                    "gamma": 1
                }
            ]
        },
        {
            "featureType": "poi",
            "stylers": [
                {
                    "hue": "#679714"
                },
                {
                    "saturation": 33.4
                },
                {
                    "lightness": -25.4
                },
                {
                    "gamma": 1
                }
            ]
        }
    ], { name: 'Custom Style' });

    var customMapTypeId = 'custom_style';

    var contentString = '<center><img src="../img/DIT.jpg" style="width:100px;height:100px;"></img></center>' +
        '<h3>DIT Cathal Brugha Street</h3>' +
        '<center><a href="college.ejs"><p>Clubs at DIT</p></a></center>';

    var grangegormanString = '<center><img src="../img/grangegorman.jpg" style="width:200px;height:120px;"></img></center>' +
        '<h3> DIT Grangegorman</h3>' +
        '<center><a href="college.ejs"><p>Clubs at DIT</p></a></center>';

    var locations = [
      ['DIT Kevin Street', 53.33733734, -6.26732737, 4],
      ['DIT Aungier Street', 53.3385481, -6.26647979, 5],
      ['DIT Bolton Street', 53.35147912, -6.26937322, 3],
      [contentString, 53.35212353, -6.2598202, 2],
      [grangegormanString, 53.3551986, -6.2780672, 1],
      ['THAT\'S ME', position.coords.latitude, position.coords.longitude, 6]
    ];

    var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    var options = {
        zoom: 13,
        center: new google.maps.LatLng(53.3468544, -6.2529955),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false
    };

    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: new google.maps.LatLng(53.3468544, -6.2629955),
      //center: coords,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
    });

    map.mapTypes.set(customMapTypeId, customMapType);
    map.setMapTypeId(customMapTypeId);

    var infowindow = new google.maps.InfoWindow();

    var marker, i;
    var image = 'datboi.png';

    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i][1], locations[i][2]),
            map: map,
            draggable: false,
            animation: google.maps.Animation.DROP,
            //icon: image
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {

                /*var infowindow = new google.maps.InfoWindow({
                  content: locations[i][0];
                  maxWidth: 200;
                })*/

                infowindow.setContent(locations[i][0]);
                infowindow.open(map, marker);

                /*if(marker.getAnimation() !== null) {
                marker.setAnimation(null);
                } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                }*/
            }
        })(marker, i));
    }
}

if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success);
} else {
    error('Geo Location is not supported');
}