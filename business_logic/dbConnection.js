var options = require('../config/configReader');
var mysql = require('mysql');

var connection = mysql.createConnection({
    host     : options.config.database_host,
    user     : options.config.database_user,
    password : options.config.database_password,
    database : options.config.database
});

module.exports = { "connection": connection };