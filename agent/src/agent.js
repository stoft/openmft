'use strict';
//-------------
// Dependencies
//-------------
var fs = require('fs');
var resourceModule = require('resource_module');
var restinterface = require('./restinterface.js');
var fileinterface = require('./fileinterface.js');
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
var agentState = resourceModule.create({
	persistenceDirectory: config.runtimeDir + '/agentState',
	master: true,
	distributed: true,
	resourceSets: [
		{
			resourceType: "notification",
			properties: [
				{
					name: "source",
					type: "number",
					required: true,
					updatesVersion: true
				},
				{
					name: "target",
					type: "number",
					required: true,
					updatesVersion: true
				},
				{
					name: "transfer",
					type: "number",
					required: true,
					updatesVersion: true
				},
				{
					name: "fileId",
					type: "number",
					required: true,
					updatesVersion: true
				},
				{
					name: "filename",
					type: "string",
					required: true,
					updatesVersion: true
				}
			]
		},
		{
			resourceType: "file",
			properties: [
				{
					name: "path",
					type: "string",
					required: true,
					updatesVersion: true
				}
			]
		},
		{
			resourceType: "upload"
		},
		{
			resourceType: "download"
			//TODO should probably contain both transfer.id and file.id
		},
		{
			resourceType: 'event',
			properties: [
				{
					name: 'time',
					type: 'string',
					required: true,
					updatesVersion: true
				},
				{
					name: 'type',
					type: 'string',
					required: true,
					updatesVersion: true
				},
				{
					name: 'agent',
					type: 'number',
					required: true,
					updatesVersion: true
				},
				{
					name: 'transfer',
					type: 'string',
					required: true,
					updatesVersion: true
				},
				{
					name: 'file',
					type: 'string',
					required: true,
					updatesVersion: true
				}
			]
		}
	]
});
console.log('Resources loaded, starting agent...');
// Initialize server
var adminProtocol = adminProtocolModule.create(config, agentState, adminState);
var fi = fileinterface.create(config, agentState, adminState);
var ri = restinterface.create(config, agentState, adminState, fi);
adminProtocol.handleAgentStarted();
client.create(config, agentState, adminState, fi, ri);
fi.start();
