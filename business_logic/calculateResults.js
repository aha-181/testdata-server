var mysql = require('mysql');
var dbConnection = require('./dbConnection');
var connection = dbConnection.connection;


function getTestResults(testNumber, res) {
    var queryLatestTest = 'SELECT TestMeasurementID, ReturnedLocationIsCorrect, ReturnedSurroundingIsCorrect, ReturnedTypeOfMotionIsCorrect, ' +
        'ReturnedPopulationDensityIsCorrect FROM returned_measurement_values WHERE TestMeasurementID = ( SELECT MAX(TestMeasurementID) ' +
        'FROM returned_measurement_values )';

    connection.query(queryLatestTest, function (error, results) {
        if(error) {
            throw error;
        }

        if(results.length > 0) {
            if(testNumber) {
                if(!isNaN(testNumber)) {
                    if(testNumber < results[0].TestMeasurementID && testNumber > 0) {
                        var queryOlderTest = 'SELECT TestMeasurementID, ReturnedLocationIsCorrect, ReturnedSurroundingIsCorrect, ReturnedTypeOfMotionIsCorrect, ' +
                            'ReturnedPopulationDensityIsCorrect FROM returned_measurement_values WHERE TestMeasurementID = ?';
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
    var surroundingTotal = 0;
    var motionTotal = 0;
    var populationTotal = 0;

    for(var i = 0; i < results.length; i++) {
        locationTotal += results[i].ReturnedLocationIsCorrect;
        surroundingTotal += results[i].ReturnedSurroundingIsCorrect;
        motionTotal += results[i].ReturnedTypeOfMotionIsCorrect;
        populationTotal += results[i].ReturnedPopulationDensityIsCorrect;
    }

    var locationPercent = (locationTotal / results.length) * 100;
    var surroundingPercent = (surroundingTotal / results.length) * 100;
    var motionPercent = (motionTotal / results.length) * 100;
    var populationPercent = (populationTotal / results.length) * 100;

    var testID = results[0].TestMeasurementID;
    var versionQuery = 'SELECT Version, PercentageOfCorrectness FROM resulting_correctness WHERE TestMeasurementID = ?';
    var inserts = [testID];
    versionQuery = mysql.format(versionQuery, inserts);

    connection.query(versionQuery, function (error, results) {
        if(error) {
            console.error(error);
            throw error;
        }

        if(results.length > 0) {
            var version = results[0].Version;
            var total = results[0].PercentageOfCorrectness;
            res.render('resultOfTests', { testNumber: testID, version: version, total: total, location: locationPercent,
                surrounding: surroundingPercent, typeOfMotion: motionPercent, populationDensity: populationPercent});
        } else {
            res.render('resultOfTests', {error: 'An error occurred'});
        }

    });
}


module.exports = { "getTestResults": getTestResults };