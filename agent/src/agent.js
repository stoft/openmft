'use strict';
//-------------
// Dependencies
//-------------
var fs = require('fs');
var resourceModule = require('resource_module');
var restinterface = require('./restinterface.js');
var fileinterface = require('./fileinterface.js');
var state = require('./state.js');
var adminProtocolModule = require('./agent_admin_protocol.js');
var client = require('./client.js');

//-------------------------
// Read agent configuration
//-------------------------
var expectedVersion = 0.1;
var configFile = process.argv[2] + '/config.json';
console.log('Reading configuration file: ' + configFile);
var config = JSON.parse(fs.readFileSync(configFile));
if (config.configVersion != expectedVersion) {
	console.log('Mismatch of agent binary and configuration versions: ' + expectedVersion + ' != ' + config.configVersion + ', exiting');
	process.exit(1);
}

//-----------------------------------
// Initialize and start agent process
//-----------------------------------
var adminState = resourceModule.create({
	persistenceDirectory: config.runtimeDir + '/adminState',
	master: false,
	resourceSets: [
		{
			resourceType: 'agent'
		},
		{
			resourceType: 'transfer'
		}
	]
});
console.log('Admin resources loaded, starting agent...');
// Initialize server
var st = state.create();
var adminProtocol = adminProtocolModule.create(config, st, adminState);
adminProtocol.handleAgentStarted();
fileinterface.create(st, config, adminState);
restinterface.create(st, adminState, config.port);
client.create(config, adminState);
