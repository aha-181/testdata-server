window.onload = function () {

    var url = '/getMobileData';

    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {

            var results = JSON.parse(this.response);
            var Latitude = null;
            var Longitude = null;
            var starttime = results[0].Date;
            var longStart = results[0].Longitude;
            var latStart = results[0].Latitude;
            var endtime = results[results.length - 1].Date;
            var longEnd = results[results.length - 1].Longitude;
            var latEnd = results[results.length - 1].Latitude;

            for(var i = 0; i < results.length; i++) {
                var MeasurementID = results[i].MeasurementID;
                var Date = results[i].Date;
                var Phase = results[i].Phase;
                Latitude = results[i].Latitude;
                Longitude = results[i].Longitude;
                var Altitude = results[i].Altitude;
                var HorizontalAccuracy = results[i].HorizontalAccuracy;
                var VerticalAccuracy = results[i].VerticalAccuracy;

                if (Latitude !== null && Longitude !== null) {
                    L.marker([Latitude, Longitude]).addTo(map);
                }

                if(Latitude !== null && Longitude !== null && HorizontalAccuracy !== null) {
                    L.circle([Latitude, Longitude], {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.1,
                        radius: HorizontalAccuracy
                    }).addTo(map);


                    //GeoAdminApi
                    var position = [WGStoCHy(Latitude, Longitude), WGStoCHx(Latitude, Longitude)];

                    // Zoom on the position
                    mapGeoadmin.getView().setCenter(position);
                    mapGeoadmin.getView().setResolution(5);
                }

                document.getElementById("measurementId").value = MeasurementID;
                document.getElementById("dateTime" + i).appendChild(document.createTextNode(Date));
                document.getElementById("lat" + i).appendChild(document.createTextNode(Latitude));
                document.getElementById("long" + i).appendChild(document.createTextNode(Longitude));
                document.getElementById("phase" + i).appendChild(document.createTextNode(Phase));
                document.getElementById("horizontalAcc" + i).appendChild(document.createTextNode(HorizontalAccuracy));
                document.getElementById("verticalAcc" + i).appendChild(document.createTextNode(VerticalAccuracy));
                document.getElementById("altitude" + i).appendChild(document.createTextNode(Altitude));
            }

            if(Latitude !== null && Longitude !== null) {
                map.setView(new L.LatLng(Latitude, Longitude), 17);
            }


            //get Velocity
            var urlVelocity = 'http://localhost:3000/speedCalculation/v1';
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
            requestVelocity.send(JSON.stringify({startTime: starttime, endTime: endtime, longitude1: longStart, latitude1: latStart,
                longitude2: longEnd, latitude2: latEnd}));

        }
    };

    request.open("GET", url);
    request.send();

};