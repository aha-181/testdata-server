window.addEventListener('load', function () {

    document.getElementById('getNewStatus').addEventListener('click', function () {

        var xmlhttp = new XMLHttpRequest();
        var url = "/testStatus";

        xmlhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {

                var json = JSON.parse(this.responseText);
                document.getElementById('testStatus').innerHTML = 'Teststatus: ' + json.testStatus;
                document.getElementById('errors').innerHTML = json.errors;
                document.getElementById('requestsDone').innerHTML = json.amountOfRequestsDone + ' of ' + json.amountOfRequests;
            }
        };

        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    })
});

