var fs = require('fs');
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'UTF-8'));
module.exports.config =  config;