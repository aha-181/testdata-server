var express = require('express');
var router = express.Router();
var calculateResults = require('../business_logic/calculateResults');
var manualTagging = require('../business_logic/manualTagging');
var testMeasurements = require('../business_logic/testMeasurements');


/* GET home page */
router.get('/', function(req, res) {
    res.render('index', { title: 'Testdata-Server' });
});



/* manual tagging */
// gets a measurement id (and its data) which wasn't already tagged
router.get('/getMobileData', function(req, res) {
    manualTagging.getMeasurementForTagging(res);
});

// saves the manually chosen values into the database
router.post('/tagMeasurement', function (req, res) {
    manualTagging.updateMeasurement(req, res);
});



/* test tagging server */
// shows the initial page where the version which will be tested can be chosen
router.get('/testMeasurements', function(req, res) {
    res.render('testingIndex');
});

// starts the actual testing process
router.post('/startTest', function(req, res) {
    testMeasurements.startTesting(req, res);
});

// shows current status of testing process
router.get('/testStatus', function(req, res) {
    testMeasurements.showStatus(res);
});



/* show results of testing */
// shows results of tested versions
router.get('/testResults', function(req, res) {
    var testNumber = req.query.test;
    calculateResults.getTestResults(testNumber, res);
});



module.exports = router;