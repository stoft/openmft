var fs = require('fs');
var restinterface = require('./restinterface.js');
var fileinterface = require('./fileinterface.js');
var state = require('./state.js');

var st = state.create();
var file = fileinterface.create(st);
var rest = restinterface.create(st);

