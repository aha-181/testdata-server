var mysql = require('mysql');
var dbConnection = require('./dbConnection');
var connection = dbConnection.connection;
var parallel = require("async/parallel");


function getTestResults(testNumber, res) {
    var queryLatestTest = 'SELECT TestMeasurementID, ReturnedLocationIsCorrect ' +
        'FROM returned_measurement_values WHERE TestMeasurementID = ( SELECT MAX(TestMeasurementID) FROM returned_measurement_values )';

    connection.query(queryLatestTest, function (error, results) {
        if(error) {
            throw error;
        }

        if(results.length > 0) {
            if(testNumber) {
                if(!isNaN(testNumber)) {
                    if(testNumber < results[0].TestMeasurementID && testNumber > 0) {
                        var queryOlderTest = 'SELECT TestMeasurementID, ReturnedLocationIsCorrect ' +
                            'FROM returned_measurement_values WHERE TestMeasurementID = ?';
                        var inserts = [testNumber];
                        queryOlderTest = mysql.format(queryOlderTest, inserts);
                        connection.query(queryOlderTest, function (error, resultsOlderQuery) {
                            if(error) {
                                console.error(error);
                                throw error;
                            }
                            if(resultsOlderQuery.length > 0) {
                                renderCalculation(res, resultsOlderQuery);
                            } else {
                                res.render('resultOfTests', {error: 'Specified Testnumber does not exist'});
                            }

                        })
                    } else if(testNumber === results[0].TestMeasurementID.toString()) {
                        renderCalculation(res, results);
                    } else {
                        res.render('resultOfTests', {error: 'Specified Testnumber does not exist'});
                    }
                } else {
                    res.render('resultOfTests', {error: 'Your input is not a number'});
                }
            } else {
                renderCalculation(res, results);
            }
        } else {
            res.render('resultOfTests', {error: 'There are no results available'});
        }
    });
}

function renderCalculation(res, results) {
    var locationTotal = 0;

    for(var i = 0; i < results.length; i++) {
        locationTotal += results[i].ReturnedLocationIsCorrect;
    }

    var locationPercent = Math.round((locationTotal / results.length) * 100);
    var testID = results[0].TestMeasurementID;

    var versionQuery = 'SELECT Version FROM resulting_correctness WHERE TestMeasurementID = ?';
    var railwayCorrectQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationIsCorrect = 1 AND TestMeasurementID = ?;';
    var railwayWrongQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationIsCorrect = 0 AND TestMeasurementID = ?;';
    var railwayUnwnownQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var streetCorrectQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 AND ' +
        'ReturnedLocationIsCorrect = 1 AND TestMeasurementID = ?;';
    var streetWrongQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 AND ' +
        'ReturnedLocationIsCorrect = 0 AND TestMeasurementID = ?;';
    var streetUnknownQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 AND ' +
        'ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var buildingCorrectQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'ReturnedLocationIsCorrect = 1 AND TestMeasurementID = ?;';
    var buildingWrongQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'ReturnedLocationIsCorrect = 0 AND TestMeasurementID = ?;';
    var buildingUnknownQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var totalError200 = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID = 100 AND TestMeasurementID = ?;';
    var railwayError200 = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationID = 100 AND TestMeasurementID = ?;';
    var inserts = [testID];
    versionQuery = mysql.format(versionQuery, inserts);
    railwayCorrectQuery = mysql.format(railwayCorrectQuery, inserts);
    railwayWrongQuery = mysql.format(railwayWrongQuery, inserts);
    railwayUnwnownQuery = mysql.format(railwayUnwnownQuery, inserts);
    streetCorrectQuery = mysql.format(streetCorrectQuery, inserts);
    streetWrongQuery = mysql.format(streetWrongQuery, inserts);
    streetUnknownQuery = mysql.format(streetUnknownQuery, inserts);
    buildingCorrectQuery = mysql.format(buildingCorrectQuery, inserts);
    buildingWrongQuery = mysql.format(buildingWrongQuery, inserts);
    buildingUnknownQuery = mysql.format(buildingUnknownQuery, inserts);
    totalError200 = mysql.format(totalError200, inserts);
    railwayError200 = mysql.format(railwayError200, inserts);

    parallel([
            function(callback) {
                dbConnection.queryMultiple([versionQuery, railwayCorrectQuery, railwayWrongQuery, railwayUnwnownQuery, streetCorrectQuery,
                    streetWrongQuery, streetUnknownQuery, buildingCorrectQuery, buildingWrongQuery, buildingUnknownQuery,
                    totalError200, railwayError200], function(err, results) {
                    callback(err, results);
                });
            }
        ],
        function(err, results) {
            if(results[0].length > 0) {

                var version = results[0][0][0].Version;

                var railwayCorrect = results[0][1][0].count;
                var railwayWrong = results[0][2][0].count;
                var railwayUnknown = results[0][3][0].count;
                var railwayTotal = railwayCorrect + railwayWrong;
                var railwayCorrectness = Math.round(railwayCorrect * 100 / railwayTotal);
                var railwayShareUnknown = Math.round(railwayUnknown * 100 / railwayWrong);

                var streetCorrect = results[0][4][0].count;
                var streetWrong = results[0][5][0].count;
                var streetUnknown = results[0][6][0].count;
                var streetTotal = streetCorrect + streetWrong;
                var streetCorrectness = Math.round(streetCorrect * 100 / streetTotal);
                var streetShareUnknown = Math.round(streetUnknown * 100 / streetWrong);

                var buildingCorrect = results[0][7][0].count;
                var buildingWrong = results[0][8][0].count;
                var buildingUnknown = results[0][9][0].count;
                var buildingTotal = buildingCorrect + buildingWrong;
                var buildingCorrectness = Math.round(buildingCorrect * 100 / buildingTotal);
                var buildingShareUnknown = Math.round(buildingUnknown * 100 / buildingWrong);

                var totalMeasurements = railwayTotal + streetTotal + buildingTotal;
                var totalUnknown = railwayUnknown + streetUnknown + buildingUnknown;
                var totalShareUnknown = Math.round(totalUnknown * 100 / totalMeasurements);

                var totalError200 = Math.round(results[0][10][0].count * 100 / totalMeasurements);
                var railwayError200 = Math.round(results[0][11][0].count * 100 / railwayTotal);

                res.render('resultOfTests', { testNumber: testID, version: version, location: locationPercent,
                    railwayCorrect: railwayCorrectness, railwayUnknown: railwayShareUnknown, streetCorrect: streetCorrectness,
                    streetUnknown: streetShareUnknown, buildingCorrect: buildingCorrectness, buildingUnknown: buildingShareUnknown,
                    totalUnknown: totalShareUnknown, totalError200: totalError200, railwayError200: railwayError200});
            } else {
                res.render('resultOfTests', {error: 'An error occurred'});
            }
        }
    );
}


module.exports = { "getTestResults": getTestResults };