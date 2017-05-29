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
    var locationTotalCorrect = 0;

    for(var i = 0; i < results.length; i++) {
        locationTotalCorrect += results[i].ReturnedLocationIsCorrect;
    }

    var shareLocationCorrect = Math.round((locationTotalCorrect / results.length) * 100);
    var testID = results[0].TestMeasurementID;

    var versionQuery = 'SELECT Version FROM resulting_correctness WHERE TestMeasurementID = ?;';
    var totalUnknown = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var totalRejected = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID >= 100 AND TestMeasurementID = ?;';

    var railwayCorrectQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationIsCorrect = 1 AND TestMeasurementID = ?;';
    var railwayTotalQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'TestMeasurementID = ?;';
    var railwayUnknownQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var railwayRejectedQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 1 AND ' +
        'ReturnedLocationID >= 100 AND TestMeasurementID = ?;';

    var streetCorrectQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 AND ' +
        'ReturnedLocationIsCorrect = 1 AND TestMeasurementID = ?;';
    var streetTotalQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 AND ' +
        'TestMeasurementID = ?;';
    var streetUnknownQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 AND ' +
        'ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var streetRejectedQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 2 ' +
        'AND ReturnedLocationID >= 100 AND TestMeasurementID = ?;';

    var buildingCorrectQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'ReturnedLocationIsCorrect = 1 AND TestMeasurementID = ?;';
    var buildingTotalQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'TestMeasurementID = ?;';
    var buildingUnknownQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'ReturnedLocationID = -1 AND TestMeasurementID = ?;';
    var buildingRejectedQuery = 'SELECT count(*) as count FROM returned_measurement_values WHERE ExpectedLocationID = 3 AND ' +
        'ReturnedLocationID >= 100 AND TestMeasurementID = ?;';

    var totalErrorAccuracy = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID = 100 AND TestMeasurementID = ?;';
    var totalErrorSameTime = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID = 101 AND TestMeasurementID = ?;';
    var totalErrorTooFar = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID = 102 AND TestMeasurementID = ?;';
    var totalErrorLonLat = 'SELECT count(*) as count FROM returned_measurement_values WHERE ReturnedLocationID = 103 AND TestMeasurementID = ?;';

    var inserts = [testID];
    versionQuery = mysql.format(versionQuery, inserts);
    totalUnknown = mysql.format(totalUnknown, inserts);
    totalRejected = mysql.format(totalRejected, inserts);

    railwayCorrectQuery = mysql.format(railwayCorrectQuery, inserts);
    railwayTotalQuery = mysql.format(railwayTotalQuery, inserts);
    railwayUnknownQuery = mysql.format(railwayUnknownQuery, inserts);
    railwayRejectedQuery = mysql.format(railwayRejectedQuery, inserts);

    streetCorrectQuery = mysql.format(streetCorrectQuery, inserts);
    streetTotalQuery = mysql.format(streetTotalQuery, inserts);
    streetUnknownQuery = mysql.format(streetUnknownQuery, inserts);
    streetRejectedQuery = mysql.format(streetRejectedQuery, inserts);

    buildingCorrectQuery = mysql.format(buildingCorrectQuery, inserts);
    buildingTotalQuery = mysql.format(buildingTotalQuery, inserts);
    buildingUnknownQuery = mysql.format(buildingUnknownQuery, inserts);
    buildingRejectedQuery = mysql.format(buildingRejectedQuery, inserts);

    totalErrorAccuracy = mysql.format(totalErrorAccuracy, inserts);
    totalErrorSameTime = mysql.format(totalErrorSameTime, inserts);
    totalErrorTooFar = mysql.format(totalErrorTooFar, inserts);
    totalErrorLonLat = mysql.format(totalErrorLonLat, inserts);

    parallel([
            function(callback) {
                dbConnection.queryMultiple([versionQuery, railwayCorrectQuery, railwayTotalQuery, railwayUnknownQuery, streetCorrectQuery,
                    streetTotalQuery, streetUnknownQuery, buildingCorrectQuery, buildingTotalQuery, buildingUnknownQuery,
                    totalUnknown, totalRejected, totalErrorAccuracy, totalErrorSameTime, totalErrorTooFar, totalErrorLonLat,
                    railwayRejectedQuery, streetRejectedQuery, buildingRejectedQuery], function(err, results) {
                    callback(err, results);
                });
            }
        ],
        function(err, results) {
            if(results[0].length > 0) {

                var version = results[0][0][0].Version;

                var railwayCorrect = results[0][1][0].count;
                var railwayTotal = results[0][2][0].count;
                var railwayUnknown = results[0][3][0].count;
                var railwayRejected = results[0][16][0].count;
                var railwayWrong = railwayTotal - railwayCorrect - railwayUnknown - railwayRejected;
                var railwayCorrectness = Math.round(railwayCorrect * 100 / (railwayTotal - railwayRejected));
                var railwayShareWrong = Math.round(railwayWrong * 100 / (railwayTotal - railwayRejected));
                var railwayShareUnknown = Math.round(railwayUnknown * 100 / (railwayTotal - railwayRejected));
                var railwayShareRejected = Math.round(railwayRejected * 100 / railwayTotal);

                var streetCorrect = results[0][4][0].count;
                var streetTotal = results[0][5][0].count;
                var streetUnknown = results[0][6][0].count;
                var streetRejected = results[0][17][0].count;
                var streetWrong = streetTotal - streetCorrect - streetUnknown - streetRejected;
                var streetCorrectness = Math.round(streetCorrect * 100 / (streetTotal - streetRejected));
                var streetShareWrong = Math.round(streetWrong * 100 / (streetTotal - streetRejected));
                var streetShareUnknown = Math.round(streetUnknown * 100 / (streetTotal - streetRejected));
                var streetShareRejected = Math.round(streetRejected * 100 / streetTotal);

                var buildingCorrect = results[0][7][0].count;
                var buildingTotal = results[0][8][0].count;
                var buildingUnknown = results[0][9][0].count;
                var buildingRejected = results[0][18][0].count;
                var buildingWrong = buildingTotal - buildingCorrect - buildingUnknown - buildingRejected;
                var buildingCorrectness = Math.round(buildingCorrect * 100 / (buildingTotal - buildingRejected));
                var buildingShareWrong = Math.round(buildingWrong * 100 / (buildingTotal - buildingRejected));
                var buildingShareUnknown = Math.round(buildingUnknown * 100 / (buildingTotal - buildingRejected));
                var buildingShareRejected = Math.round(buildingRejected * 100 / buildingTotal);

                var totalMeasurements = railwayTotal + streetTotal + buildingTotal;
                var totalUnknown = results[0][10][0].count;
                var totalShareUnknown = Math.round(totalUnknown * 100 / totalMeasurements);
                var totalRejected = results[0][11][0].count;
                var totalShareRejected = Math.round(totalRejected * 100 / totalMeasurements);
                var totalShareWrong = 100 - totalShareUnknown - totalShareRejected - shareLocationCorrect;

                var totalErrorAccuracy = results[0][12][0].count;
                var shareAccuracy = Math.round(totalErrorAccuracy * 100 / totalRejected);
                var totalErrorSameTime = results[0][13][0].count;
                var shareSameTime = Math.round(totalErrorSameTime * 100 / totalRejected);
                var totalErrorTooFar = results[0][14][0].count;
                var shareTooFar = Math.round(totalErrorTooFar * 100 / totalRejected);
                var totalErrorLonLat = results[0][15][0].count;
                var shareLonLat = Math.round(totalErrorLonLat * 100 / totalRejected);

                var totalAccepted = totalMeasurements - totalRejected;
                var shareAcceptedCorrect = Math.round(locationTotalCorrect * 100 / totalAccepted);
                var shareAcceptedUnknown = Math.round(totalUnknown * 100 / totalAccepted);
                var shareAcceptedWrong = 100 - shareAcceptedCorrect - shareAcceptedUnknown;

                res.render('resultOfTests', { testNumber: testID, version: version,
                    totalCount: totalMeasurements, totalCorrect: shareLocationCorrect, totalWrong: totalShareWrong, totalUnknown: totalShareUnknown, totalRejected: totalShareRejected,
                    rejectedCount: totalRejected, rejectedAccuracy: shareAccuracy, rejectedSameTime: shareSameTime, rejectedTooFar: shareTooFar, rejectedLonLat: shareLonLat,
                    acceptedCount: totalAccepted, acceptedCorrect: shareAcceptedCorrect, acceptedWrong: shareAcceptedWrong, acceptedUnknown: shareAcceptedUnknown,
                    railwayCount: railwayTotal, railwayCorrect: railwayCorrectness, railwayWrong: railwayShareWrong, railwayUnknown: railwayShareUnknown, railwayRejected: railwayShareRejected,
                    streetCount: streetTotal, streetCorrect: streetCorrectness, streetWrong: streetShareWrong, streetUnknown: streetShareUnknown, streetRejected: streetShareRejected,
                    buildingCount: buildingTotal, buildingCorrect: buildingCorrectness, buildingWrong: buildingShareWrong, buildingUnknown: buildingShareUnknown, buildingRejected: buildingShareRejected });
            } else {
                res.render('resultOfTests', {error: 'An error occurred'});
            }
        }
    );
}


module.exports = { "getTestResults": getTestResults };