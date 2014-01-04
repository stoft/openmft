//-------------
// Dependencies
//-------------
var fs = require('fs');
var restify = require('restify');
var restinterface = require('./restinterface.js');
var fileinterface = require('./fileinterface.js');
var state = require('./state.js');

//-------------------------
// Read agent configuration
//-------------------------
var expectedVersion = 0.1;
var configFile = process.argv[2] + '/config.json';
console.log("Reading configuration file: " + configFile);
var config = JSON.parse(fs.readFileSync(configFile));
if (config.configVersion != expectedVersion) {
	console.log("Mismatch of agent binary and configuration versions: " + expectedVersion + " != " + config.version + ", exiting");
	process.exit(1);
}

//-----------------------------------
// Initialize and start agent process
//-----------------------------------
var st = state.create(config);
var file = fileinterface.create(st, config);
var rest = restinterface.create(st, config);

//-------------------------------------------------------------
// Announce ourselves to admin (if running, e.g. ignore errors)
//-------------------------------------------------------------
var adminClient = restify.createJsonClient({
	url: "http://" + config.adminHost + ":" + config.adminPort,
	version: '*'
});
config.state = "RUNNING";
adminClient.put("/rest/v1/agents/" + config.id, config, function(err, req, res, obj) {
	if (err) {
		console.log("Could not register with administrator: " + err);
	}
	else {
		console.log("Successfully registered with administrator")
	}
});