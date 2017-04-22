var express = require('express');
var options = require('../config/configReader');
var router = express.Router();
var request = require('request');


var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : options.config.database_host,
    user     : options.config.database_user,
    password : options.config.database_password,
    database : options.config.database
});


var testStatus = 'Working';
var errors = '';
var amountOfRequests;
var amountOfRequestsDone = 0;

function requestFinished(testMeasurementID) {
    if(++amountOfRequestsDone === amountOfRequests) {
        testStatus = 'Done';
        var query = 'SELECT ReturnedLocationIsCorrect, ReturnedSurroundingIsCorrect, ReturnedTypeOfMotionIsCorrect, ReturnedPopulationDensityIsCorrect ' +
            'FROM returned_measurement_values WHERE TestMeasurementID = ?';
        var inserts = [testMeasurementID];
        query = mysql.format(query, inserts);
        connection.query(query, function (error, results, fields) {
            if (error) {
                res.render('TestingFeedback', {errors: 'error4'});
                throw error;
            }

            var totalCorrect = 0;
            for(var i = 0; i < results.length; i++) {
                totalCorrect = results[i].ReturnedLocationIsCorrect + results[i].ReturnedSurroundingIsCorrect +
                    results[i].ReturnedTypeOfMotionIsCorrect + results[i].ReturnedPopulationDensityIsCorrect;
            }

            var resultingPercent = (totalCorrect / (results.length * 4)) * 100;

            var updateQuery = 'UPDATE resulting_correctness SET PercentageOfCorrectness = ? WHERE TestMeasurementID = ?';
            var insertsOfUpdate = [resultingPercent, testMeasurementID];
            updateQuery = mysql.format(updateQuery, insertsOfUpdate);
            connection.query(updateQuery, function (error, results) {
                if (error) {
                    res.render('TestingFeedback', {errors: 'error5'});
                    throw error;
                }

                //TODO: show results
                console.log("done!");
            });

        });
    }
}


router.get('/testStatus', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ testStatus: testStatus, amountOfRequests: amountOfRequests,
        amountOfRequestsDone: amountOfRequestsDone, errors: errors }));
});



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Testdata-Server' });
});


// manuelles Tagging:
router.get('/getMobileData', function(req, res, next) {

    var query = 'SELECT * FROM mobile_data_log as v1 INNER JOIN (SELECT MeasurementID FROM mobile_data_log WHERE ExpectedLocationID IS NULL LIMIT 1) as v2 ON v1.MeasurementID = v2.MeasurementID;';

    connection.query(query, function (error, results, fields) {
        if(error) {
            throw error;
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(results);
    });
});

router.post('/tagMeasurement', function (req, res) {

    var sql = 'UPDATE mobile_data_log SET ExpectedLocationID = ?, ExpectedSurroundingID = ?, ExpectedTypeOfMotionID = ?, ExpectedPopulationDensityID = ? WHERE MeasurementID = ?';
    var inserts = [req.body.locationTag, req.body.surroundingTag, req.body.typeOfMotionTag, req.body.populationDensityTag, req.body.measurementId];
    sql = mysql.format(sql, inserts);

    console.log(sql);

    connection.query(sql, function (error, results, fields) {

        if(error) {
            res.render('manualTaggingFeedback', {result: 'error'});
            throw error;
        } else {
            res.render('manualTaggingFeedback', {result: 'success'});
        }
    });
});

// Testen der Messungen
router.get('/testMeasurements', function(req, res, next) {
    res.render('testingIndex');
});

router.post('/startTest', function(req, res) {

    var version = req.body.version;
    var getMeasurementCountQuery = 'SELECT COUNT(DISTINCT MeasurementID) as count FROM mobile_data_log WHERE ExpectedLocationID IS NOT NULL AND ExpectedLocationID != -1';

    connection.query(getMeasurementCountQuery, function (error, results, fields) {
        if(error) {
            res.render('TestingFeedback', {errors: 'error1'});
            throw error;
        }
        var measurementCount = results[0].count;
        amountOfRequests = results[0].count;

        var insertQueryResultingCorrectness = "INSERT INTO resulting_correctness (Date, Version, NumberOfMeassurements) VALUES(NOW(), ?, ?);";
        var inserts = [version, measurementCount];
        insertQueryResultingCorrectness = mysql.format(insertQueryResultingCorrectness, inserts);

        connection.query(insertQueryResultingCorrectness, function (error, results, fields) {
            if(error) {
                res.render('TestingFeedback', {errors: 'error2'});
                throw error;
            }
            var testMeasurementID = results.insertId;

            const getTaggedMeasurementsQuery = 'SELECT MeasurementID, ID, ExpectedLocationID, ExpectedSurroundingID, ' +
                'ExpectedTypeOfMotionID, ExpectedPopulationDensityID, Latitude, Longitude, Date FROM mobile_data_log ' +
                'WHERE ExpectedLocationID IS NOT NULL AND ExpectedLocationID != -1 ORDER BY MeasurementID ASC';

            connection.query(getTaggedMeasurementsQuery, function(error, results, fields) {
                if(error) {
                    res.render('TestingFeedback', {errors: 'error3'});
                    throw error;
                }


                var measurementID = results[0].MeasurementID;
                var positions = [];
                var expectedResult = [];
                var postData = {};

                for(var i = 0; i < results.length; i++) {

                    if(measurementID === results[i].MeasurementID) {
                        positions[results[i].ID - 1] = {
                            "longitude": results[i].Longitude,
                            "latitude": results[i].Latitude,
                            "time": results[i].Date
                        };

                        if(i === results.length - 1) {
                            expectedResult[0] = results[i];
                            postData = { "positions": positions };
                            getTagging(version, postData, testMeasurementID, JSON.parse(JSON.stringify(expectedResult)), insertTaggingResults);
                            measurementID = results[i].MeasurementID;
                            positions = [];
                        }
                    } else {
                        expectedResult[0] = results[i - 1];
                        postData = { "positions": positions };
                        getTagging(version, postData, testMeasurementID, JSON.parse(JSON.stringify(expectedResult)), insertTaggingResults);
                        measurementID = results[i].MeasurementID;
                        positions = [];
                        positions[results[i].ID - 1] = {
                            "longitude": results[i].Longitude,
                            "latitude": results[i].Latitude,
                            "time": results[i].Date
                        };
                    }
                }

                res.render('TestingFeedback', { testStatus: testStatus, amountOfRequests: amountOfRequests,
                    amountOfRequestsDone: amountOfRequestsDone, errors: errors });
            });
        });
    });
});


function insertTaggingResults(taggingResult, expectedResult, testMeasurementID) {


    var expectedLocationID = expectedResult[0].ExpectedLocationID;
    var returnedLocationID = taggingResult.measuring_location.location.id;
    var returnedLocationIsCorrect = expectedLocationID === returnedLocationID ? 1 : 0;

    var expectedSurroundingID = expectedResult[0].ExpectedSurroundingID;
    var returnedSurroundingID = taggingResult.measuring_location.surrounding.id;
    var returnedSurroundingIsCorrect = expectedSurroundingID === returnedSurroundingID ? 1 : 0;

    var expectedTypeOfMotionID = expectedResult[0].ExpectedTypeOfMotionID;
    var returnedTypeOfMotionID = taggingResult.type_of_motion.id;
    var returnedTypeOfMotionIsCorrect = expectedTypeOfMotionID === returnedTypeOfMotionID ? 1 : 0;

    var expectedPopulationDensityID = expectedResult[0].ExpectedPopulationDensityID;
    var returnedPopulationDensityID = taggingResult.population_density.id;
    var returnedPopulationDensityIsCorrect = expectedPopulationDensityID === returnedPopulationDensityID ? 1 : 0;

    var insertMeasurmentExcpectationsAndResultsQuery = 'INSERT INTO returned_measurement_values (MeasurementID, TestMeasurementID, ExpectedLocationID, ' +
        'ExpectedSurroundingID, ExpectedTypeOfMotionID, ExpectedPopulationDensityID, ReturnedLocationID, ReturnedSurroundingID, ReturnedTypeOfMotionID, ' +
        'ReturnedPopulationDensityID, ReturnedLocationIsCorrect, ReturnedSurroundingIsCorrect, ReturnedTypeOfMotionIsCorrect, ' +
        'ReturnedPopulationDensityIsCorrect) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var expectationsInserts = [expectedResult[0].MeasurementID, testMeasurementID, expectedLocationID, expectedSurroundingID, expectedTypeOfMotionID,
        expectedPopulationDensityID, returnedLocationID, returnedSurroundingID, returnedTypeOfMotionID, returnedPopulationDensityID,
        returnedLocationIsCorrect, returnedSurroundingIsCorrect, returnedTypeOfMotionIsCorrect, returnedPopulationDensityIsCorrect];
    insertMeasurmentExcpectationsAndResultsQuery = mysql.format(insertMeasurmentExcpectationsAndResultsQuery, expectationsInserts);

    connection.query(insertMeasurmentExcpectationsAndResultsQuery, function(error, result, fields) {
        if(error) {
            errors = 'Insert failed: ' + expectedResult[0].MeasurementID;
            throw error;
        }
        requestFinished(testMeasurementID);
    });
}




function getTagging(version, postData, testMeasurementID, expectedResult, callback) {

    request.post(
        'http://localhost:3000/tags/' + version,
        { json: postData },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                callback(response.body, expectedResult, testMeasurementID);
            } else {
                console.log("error message: " + response.body.validations.body[0].messages);
                console.log("status code: " + response.statusCode);
                errors = response.body.validations.body[0].messages[0];
            }
        }
    );
}

module.exports = router;
