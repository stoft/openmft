//---------------------------------------------------------------------------
// Administrator server
// Started by mimosa
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var path = require("path");
	var fs = require("fs");
	var socketio = require("socket.io");
	var restInterface = require("./rest_interface.js");
	var resourceModule = require("resource_module");
	var socketInterfaceModule = require("./socket_interface.js");
	var agentProtocol = require("./admin_agent_protocol.js");

	//-----------------------------------
	// Initialize and start admin process
	//-----------------------------------
	var startServer = function(mimosaConfig, callback) {
		//-------------------------
		// Read admin configuration
		//-------------------------
		var expectedVersion = 0.1;
		var configFile = path.resolve("../../etc/current/config.json");
		console.log("Reading configuration file: " + configFile);
		var config = JSON.parse(fs.readFileSync(configFile));
		if (config.configVersion != expectedVersion) {
			console.log("Mismatch of admin binary and configuration versions: " + expectedVersion + " != " + config.version + ", exiting");
			process.exit(1);
		}

		//-------------------------
		// Load resource state
		//-------------------------
		var state = resourceModule.create({
			persistenceDirectory: config.runtimeDir,
			master: true,
			resourceSets: [
				{
					resourceType: "agent",
					properties: [
						{
							name: "name",
							type: "string",
							required: true,
							updatesVersion: true
						},
						{
							name: "host",
							type: "string",
							required: true,
							updatesVersion: true
						},
						{
							name: "port",
							type: "number",
							required: true,
							updatesVersion: true
						},
						{
							name: "inboundDir",
							type: "string",
							required: true,
							updatesVersion: true
						},
						{
							name: "outboundDir",
							type: "string",
							required: true,
							updatesVersion: true
						},
						{
							name: "state",
							type: "string",
							required: false,
							updatesVersion: false,
							default: "UNKNOWN"
						}
					]
				},
				{
					resourceType: "transfer",
					properties: [
						{
							name: "name",
							type: "string",
							required: true,
							updatesVersion: true
						},
						{
							name: "sources",
							type: "array",
							required: true,
							updatesVersion: true
						},
						{
							name: "targets",
							type: "array",
							required: true,
							updatesVersion: true
						},
						{
							name: "synced",
							type: "array",
							required: false,
							updatesVersion: false
						},
						{
							name: "state",
							type: "string",
							required: false,
							updatesVersion: false,
							default: "OUT_OF_SYNC"
						}
					]
				}
			]
		}, function(err) {
			if (! err) {
				console.log("Resources loaded, starting server...");
				// Initialize server
				var protocol = agentProtocol.create(state);
				var server = restInterface.create(config, state);
				var io = socketio.listen(server);
				io.set("log level", 1); // reduce logging
				socketInterfaceModule.create(state, io);

				// Mimosa wants us to invoke the callback
				callback(server, io);
				protocol.handleAdminStarted();
			}
			else {
				console.log("Could not initialize/load resources, exiting: " + err);
				process.exit(1);
			}
		});
	};

	//---------------
	// Module exports
	//---------------
    module.exports.startServer = function(mimosaConfig, callback) {
        return startServer(mimosaConfig, callback);
    };
}());