window.onload = function () {

    var url = '/getMobileData';

    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {

            // read out values which are needed for the velocity calculation
            var results = JSON.parse(this.response);
            var latitude = null;
            var longitude = null;
            var startTime = results[0].Date;
            var longStart = results[0].Longitude;
            var latStart = results[0].Latitude;
            var endTime = results[results.length - 1].Date;
            var longEnd = results[results.length - 1].Longitude;
            var latEnd = results[results.length - 1].Latitude;

            // loop over every point in the result and set point on map and data in table
            for(var i = 0; i < results.length; i++) {
                latitude = results[i].Latitude;
                longitude = results[i].Longitude;
                var horizontalAccuracy = results[i].HorizontalAccuracy;

                if (latitude !== null && longitude !== null) {
                    L.marker([latitude, longitude]).addTo(mapOsm);
                }

                if(latitude !== null && longitude !== null && horizontalAccuracy !== null) {
                    // add radius of horizontal accuracy to the osm map
                    L.circle([latitude, longitude], {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.1,
                        radius: horizontalAccuracy
                    }).addTo(mapOsm);
                }

                document.getElementById("measurementId").value = results[i].MeasurementID;
                document.getElementById("dateTime" + i).appendChild(document.createTextNode(results[i].Date));
                document.getElementById("lat" + i).appendChild(document.createTextNode(latitude));
                document.getElementById("long" + i).appendChild(document.createTextNode(longitude));
                document.getElementById("phase" + i).appendChild(document.createTextNode(results[i].Phase));
                document.getElementById("horizontalAcc" + i).appendChild(document.createTextNode(horizontalAccuracy));
                document.getElementById("verticalAcc" + i).appendChild(document.createTextNode(results[i].VerticalAccuracy));
                document.getElementById("altitude" + i).appendChild(document.createTextNode(results[i].Altitude));
            }

            if(latitude !== null && longitude !== null) {
                // zoom in on last point on the osm map
                mapOsm.setView(new L.LatLng(latitude, longitude), 17);


                //GeoAdminApi
                var position = [WGStoCHy(latitude, longitude), WGStoCHx(latitude, longitude)];
                // Zoom in on the position on the geoAdmin map
                mapGeoadmin.getView().setCenter(position);
                mapGeoadmin.getView().setResolution(5);
            }


            //get Velocity
            var urlVelocity = 'http://localhost:3000/api/v4/calculateSpeed';
            var requestVelocity = new XMLHttpRequest();
            requestVelocity.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    var result = JSON.parse(this.response);
                    document.getElementById("velocity").appendChild(document.createTextNode(result.velocity_kmh));
                    document.getElementById("distance").appendChild(document.createTextNode(result.distance_m));
                    document.getElementById("time").appendChild(document.createTextNode(result.time_s));
                }
            };

            requestVelocity.open('POST', urlVelocity);
            requestVelocity.setRequestHeader("Content-Type", "application/json");
            requestVelocity.send(JSON.stringify( { positions: [
                                                    {longitude: longStart, latitude: latStart, time: startTime},
                                                    {longitude: longEnd, latitude: latEnd, time: endTime}] } ));

        }
    };

    request.open("GET", url);
    request.send();

};