//-------------
// Dependencies
//-------------
var fs = require('fs');
var restify = require('restify');
var resourceModule = require('resource_module')
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
var adminState = resourceModule.create({
	persistenceDirectory: config.runtimeDir + "/adminState",
	master: false,
	resourceSets: [
		{
			resourceType: "agent",
			properties: [
				{
					name: "name",
					type: "string"
				},
				{
					name: "host",
					type: "string"
				},
				{
					name: "port",
					type: "number"
				},
				{
					name: "inboundDir",
					type: "string"
				},
				{
					name: "outboundDir",
					type: "string"
				},
				{
					name: "state",
					type: "string"
				}
			]
		},
		{
			resourceType: "transfer",
			properties: [
				{
					name: "name",
					type: "string"
				},
				{
					name: "sources",
					type: "array"
				},
				{
					name: "targets",
					type: "array"
				},
				{
					name: "state",
					type: "string"
				}
			]
		}
	]
}, function(err) {
	if (! err) {
		console.log("Admin resources loaded, starting agent...");
		// Initialize server
		var st = state.create(config);
		var file = fileinterface.create(st, config);
		var rest = restinterface.create(st, config);
	}
	else {
		console.log("Could not initialize/load resources, exiting: " + err);
		process.exit(1);
	}
});

//-------------------------------------------------------------
// Announce ourselves to admin (if running, e.g. ignore errors)
//-------------------------------------------------------------
// var adminClient = restify.createJsonClient({
// 	url: "http://" + config.adminHost + ":" + config.adminPort,
// 	version: '*'
// });
// config.state = "RUNNING";
// adminClient.put("/rest/v1/agents/" + config.id, config, function(err, req, res, obj) {
// 	if (err) {
// 		console.log("Could not register with administrator: " + err);
// 	}
// 	else {
// 		console.log("Successfully registered with administrator")
// 	}
// });