window.onload = function () {

    document.getElementById('startTestButton').addEventListener('click', function (event) {

        event.preventDefault();

        var xmlhttp = new XMLHttpRequest();
        var url = "/testFinished";

        xmlhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {

                var json = JSON.parse(this.responseText);

                if(json.isFinished) {
                    document.getElementById('testVersionForm').submit();
                } else {
                    document.getElementById('testFinished').innerHTML = 'Test is finished: ' + json.isFinished;
                }
            }
        };

        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    })
};