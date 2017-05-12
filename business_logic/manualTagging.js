var mysql = require('mysql');
var dbConnection = require('./dbConnection');
var connection = dbConnection.connection;


function getMeasurementForTagging(res) {
    var query = 'SELECT * FROM mobile_data_log as v1 INNER JOIN ' +
        '(SELECT MeasurementID FROM mobile_data_log WHERE ExpectedLocationID IS NULL LIMIT 1) ' +
        'as v2 ON v1.MeasurementID = v2.MeasurementID;';

    connection.query(query, function (error, results) {
        if(error) {
            console.error(error);
            throw error;
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(results);
    });
}

function updateMeasurement(req, res) {
    var query = 'UPDATE mobile_data_log SET ExpectedLocationID = ? WHERE MeasurementID = ?';
    var inserts = [req.body.locationTag, req.body.measurementId];
    query = mysql.format(query, inserts);

    connection.query(query, function (error) {

        if(error) {
            res.render('manualTaggingFeedback', {result: 'error'});
            throw error;
        } else {
            res.render('manualTaggingFeedback', {result: 'success'});
        }
    });
}


module.exports = { 'getMeasurementForTagging': getMeasurementForTagging, 'updateMeasurement': updateMeasurement };