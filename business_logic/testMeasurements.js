var request = require('request');
var mysql = require('mysql');
var dbConnection = require('./dbConnection');
var connection = dbConnection.connection;


var testStatus = 'Working';
var errors = '';
var amountOfRequests = 0;
var amountOfRequestsDone = 0;

function isFinished() {
    return amountOfRequests === amountOfRequestsDone;
}


function startTesting(req, res) {
    amountOfRequestsDone = 0;
    var version = req.body.version;
    var getMeasurementCountQuery = 'SELECT COUNT(DISTINCT MeasurementID) as count FROM mobile_data_log ' +
        'WHERE ExpectedLocationID IS NOT NULL AND ExpectedLocationID != -1';

    connection.query(getMeasurementCountQuery, function (error, results) {
        if(error) {
            res.render('testingFeedback', {errors: 'error1'});
            console.error(error);
            throw error;
        }

        var measurementCount = results[0].count;
        amountOfRequests = results[0].count;

        var insertQueryResultingCorrectness = "INSERT INTO resulting_correctness (Date, Version, NumberOfMeasurements) VALUES(NOW(), ?, ?);";
        var inserts = [version, measurementCount];
        insertQueryResultingCorrectness = mysql.format(insertQueryResultingCorrectness, inserts);

        connection.query(insertQueryResultingCorrectness, function (error, results) {
            if(error) {
                res.render('testingFeedback', {errors: 'error2'});
                console.error(error);
                throw error;
            }
            var testMeasurementID = results.insertId;

            const getTaggedMeasurementsQuery = 'SELECT MeasurementID, ID, ExpectedLocationID, ' +
                'Latitude, Longitude, Date, Phase, HorizontalAccuracy FROM mobile_data_log ' +
                'WHERE ExpectedLocationID IS NOT NULL AND ExpectedLocationID != -1 ORDER BY MeasurementID ASC';

            connection.query(getTaggedMeasurementsQuery, function(error, results) {
                if(error) {
                    res.render('testingFeedback', {errors: 'error3'});
                    console.error(error);
                    throw error;
                }

                var counter = 0;
                var intervalId = setInterval(function () {
                    var testData = results.slice(counter, counter + 8);
                    prepareRequestData(testData, version, testMeasurementID);
                    counter += 8;
                    if(counter >= results.length) {
                        clearInterval(intervalId);
                        console.log("done!!!");
                    }
                }, 50);


                res.render('testingFeedback', { testStatus: testStatus, amountOfRequests: amountOfRequests,
                    amountOfRequestsDone: amountOfRequestsDone, errors: errors });
            });
        });
    });
}


function prepareRequestData(results, version, testMeasurementID) {
    var measurementID = results[0].MeasurementID;
    var positions = [];
    var expectedResult = [];
    var postData = {};

    for(var i = 0; i < 8; i++) {

        if(measurementID === results[i].MeasurementID) {
            positions[results[i].ID - 1] = {
                "longitude": results[i].Longitude,
                "latitude": results[i].Latitude,
                "horizontalAccuracy": results[i].HorizontalAccuracy,
                "time": results[i].Date,
                "phase": results[i].Phase
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
                "horizontalAccuracy": results[i].HorizontalAccuracy,
                "time": results[i].Date,
                "phase": results[i].Phase
            };
        }
    }
}

function getTagging(version, postData, testMeasurementID, expectedResult, callback) {

    request.post(
        'http://localhost:3000/api/' + version + '/tag',
        { json: postData },
        function (error, response) {

            if (!error && response.statusCode === 200) {
                callback(response.body, expectedResult, testMeasurementID);
            } else {

                if(response.statusCode === 400 && response.body.error === 'Cannot tag positions less accurate than 200 meters.') {
                    var errorJson1 = {
                      'location': {
                          'id': 100,
                          'weight': null
                      }
                    };
                    callback(errorJson1, expectedResult, testMeasurementID);
                } else if(response.statusCode === 400 && response.body.error === 'All positions have the same time.') {
                    var errorJson2 = {
                        'location': {
                            'id': 101,
                            'weight': null
                        }
                    };
                    callback(errorJson2, expectedResult, testMeasurementID);
                } else if(response.statusCode === 400 && response.body.error === 'The input-positions are too far away from each other.') {
                    var errorJson3 = {
                        'location': {
                            'id': 102,
                            'weight': null
                        }
                    };
                    callback(errorJson3, expectedResult, testMeasurementID);
                } else if(response.statusCode === 400 && response.body.error === 'Cannot tag invalid positions. (Multiple occurrences of longitude or latitude 0 OR invalid time strings.)') {
                    var errorJson4 = {
                        'location': {
                            'id': 103,
                            'weight': null
                        }
                    };
                    callback(errorJson4, expectedResult, testMeasurementID);
                } else if(response.statusCode === 400 && response.body.error === 'Not all positions are located within switzerland.') {
                    var errorJson5 = {
                        'location': {
                            'id': 104,
                            'weight': null
                        }
                    };
                    callback(errorJson5, expectedResult, testMeasurementID);
                } else if(response.statusCode === 400 && response.body.error === 'Phases DownloadStart, DownloadEnd and UploadEnd where expected. At least one phase is missing.') {
                    var errorJson6 = {
                        'location': {
                            'id': 105,
                            'weight': null
                        }
                    };
                    callback(errorJson6, expectedResult, testMeasurementID);
                } else if(response.statusCode === 500) {
                    var errorJson7 = {
                        'location': {
                            'id': 106,
                            'weight': null
                        }
                    };
                    callback(errorJson7, expectedResult, testMeasurementID);
                    console.error("Internal Server Error happened!!!");
                }
                else {
                    console.error("error happened!!!");
                    console.error(response);
                    errors = "error happened!!!";
                }
            }
        }
    );
}

function insertTaggingResults(taggingResult, expectedResult, testMeasurementID) {

    var expectedLocationID = expectedResult[0].ExpectedLocationID;
    var returnedLocationID = taggingResult.location.id;
    var returnedLocationIsCorrect = expectedLocationID === returnedLocationID ? 1 : 0;

    var insertMeasurementExpectationsAndResultsQuery = 'INSERT INTO returned_measurement_values (MeasurementID, TestMeasurementID, ' +
        'ExpectedLocationID, ReturnedLocationID, ReturnedLocationIsCorrect, ReturnedWeight) ' +
        'VALUES (?, ?, ?, ?, ?, ?)';
    var expectationsInserts = [expectedResult[0].MeasurementID, testMeasurementID, expectedLocationID, returnedLocationID,
        returnedLocationIsCorrect, taggingResult.location.weight];
    insertMeasurementExpectationsAndResultsQuery = mysql.format(insertMeasurementExpectationsAndResultsQuery, expectationsInserts);

    connection.query(insertMeasurementExpectationsAndResultsQuery, function(error) {
        if(error) {
            errors = 'Insert failed: ' + expectedResult[0].MeasurementID;
            throw error;
        }
        requestFinished(testMeasurementID);
    });
}

function requestFinished(testMeasurementID) {
    if(++amountOfRequestsDone === amountOfRequests) {
        var query = 'SELECT ReturnedLocationIsCorrect FROM returned_measurement_values WHERE TestMeasurementID = ?';
        var inserts = [testMeasurementID];
        query = mysql.format(query, inserts);
        connection.query(query, function (error, results) {
            if (error) {
                console.error(error);
                throw error;
            }

            var totalCorrect = 0;
            for(var i = 0; i < results.length; i++) {
                totalCorrect = totalCorrect + results[i].ReturnedLocationIsCorrect;
            }

            var resultingPercent = (totalCorrect / (results.length)) * 100;
            console.log(resultingPercent);

            var updateQuery = 'UPDATE resulting_correctness SET PercentageOfCorrectness = ? WHERE TestMeasurementID = ?';
            var insertsOfUpdate = [resultingPercent, testMeasurementID];
            updateQuery = mysql.format(updateQuery, insertsOfUpdate);
            connection.query(updateQuery, function (error) {
                if (error) {
                    console.error(error);
                    throw error;
                }
                testStatus = 'Done';
            });

        });
    }
}


function showStatus(res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ testStatus: testStatus, amountOfRequests: amountOfRequests,
        amountOfRequestsDone: amountOfRequestsDone, errors: errors }));
}

module.exports = { 'startTesting': startTesting, 'showStatus': showStatus, 'isFinished': isFinished };