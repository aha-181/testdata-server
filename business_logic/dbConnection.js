var options = require('../config/configReader');
var mysql = require('mysql');
var parallel = require("async/parallel");

var connection = mysql.createConnection({
    host     : options.config.database_host,
    user     : options.config.database_user,
    password : options.config.database_password,
    database : options.config.database
});

function queryMultiple(statements, callback) {

    var dbRequests = [];

    for(var i = 0; i < statements.length; i++) {

        dbRequests[i] = (function (i) {
            return function(callback) {
                connection.query(statements[i], function (err, result) {
                    if (err) {
                        return console.error('error happened during query', err)
                    }
                    callback(null, result);
                });
            };
        })(i);
    }

    parallel(dbRequests,
        function(err, results) {
            callback(err, results)
        });
}

module.exports = { "connection": connection, "queryMultiple": queryMultiple };