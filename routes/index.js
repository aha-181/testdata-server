var express = require('express');
var options = require('../config/configReader');
var router = express.Router();


var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : options.config.database_host,
    user     : options.config.database_user,
    password : options.config.database_password,
    database : options.config.database
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Testdata-Server' });
});

//TODO: ACCURACY-TESTING
//TODO: Call HSR-Server
//TODO: Compare Results with MySQL-Tagging
//TODO: Output Result

router.get('/getMobileData', function(req, res, next) {

    var query = 'SELECT * FROM mobile_data_log as v1 INNER JOIN (SELECT MeasurementID FROM mobile_data_log WHERE ExpectedGroundID IS NULL LIMIT 1) as v2 ON v1.MeasurementID = v2.MeasurementID;';

    connection.query(query, function (error, results, fields) {
        if(error) {
            throw error;
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(results);
    });
});


router.post('/tagMeasurement', function (req, res) {

    //var query = 'UPDATE mobile_data_log SET Tag = \'unknown\' WHERE MeasurementID = 37457283';

    var sql = 'UPDATE mobile_data_log SET ExpectedGroundID = ?, ExpectedSurroundingID = ?, ExpectedTypeOfMotionID = ?, ExpectedPopulationDensityID = ? WHERE MeasurementID = ?';
    var inserts = [req.body.groundTag, req.body.surroundingTag, req.body.typeOfMotionTag, req.body.populationDensityTag, req.body.measurementId];
    sql = mysql.format(sql, inserts);

    console.log(sql);

    connection.query(sql, function (error, results, fields) {

        if(error) {
            res.render('result', {result: 'error'});
            throw error;
        } else {
            res.render('result', {result: 'success'});
        }
    });
});


module.exports = router;
