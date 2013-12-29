//-------------
// Dependencies
//-------------
var fs = require('fs');
var restinterface = require('./restinterface.js');
var fileinterface = require('./fileinterface.js');
var state = require('./state.js');

//-----------------------------------
// Initialize and start agent process
//-----------------------------------
var config = JSON.parse(fs.readFileSync("/var/tmp/openmft/" + process.argv[2] + '/config.json'));

var st = state.create(config);
var file = fileinterface.create(st, config);
var rest = restinterface.create(st, config);
