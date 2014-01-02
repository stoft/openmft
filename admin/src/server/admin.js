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
	var stateModule = require("./state.js");
	var updateModule = require("./socket_interface.js");

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
		var state = stateModule.create({
			persistenceDirectory: config.runtimeDir,
			resourceSets: [
				{ resourceType: "agent" },
				{ resourceType: "transfer" }
			]
		}, function(err) {
			if (! err) {
				console.log("Resources loaded, starting server...");
				// Initialize server
				var server = restInterface.create(config, state);
				var io = socketio.listen(server);
				io.set('log level', 1); // reduce logging
				var updater = updateModule.create(state, io);

				// Mimosa wants us to invoke the callback
				callback(server, io);
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