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
	var restify = require("restify");
	var async = require("async");
	var socketio = require("socket.io");
	var restInterface = require("./rest_interface.js");
	var stateModule = require("./state.js");
	var socketInterfaceModule = require("./socket_interface.js");

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
				io.set("log level", 1); // reduce logging
				socketInterfaceModule.create(state, io);

				// Mimosa wants us to invoke the callback
				callback(server, io);
			}
			else {
				console.log("Could not initialize/load resources, exiting: " + err);
				process.exit(1);
			}
		});

		// Agent handshake
		state.on("update", function(e, old) {
			if (e.resourceType == "agent" && e.agent.state == "RUNNING" && old.state != "RUNNING") {
				// Agent just came online, make sure that the agent has the correct transfer versions
				// console.log("Agent handshake, admin should ask for list of transfers");
				var agentClient = restify.createJsonClient({
					url: "http://" + e.agent.host + ":" + e.agent.port,
					version: "*"
				});
				console.log("Initiating agent " + e.agent.name + " handshake: " + e.agent.host + ":" + e.agent.port);
				async.waterfall([
					// Request a list of transfers from agent
					function(callback) {
						console.log("Retrieving transfers from agent...");
						agentClient.get("/rest/v1/transfers", callback);
					},
					// Now get the list of transfers from admin
					function(req, res, agentTransfers, callback) {
						console.log("Got agent transfer list: " + JSON.stringify(agentTransfers.transfers));
						state.findResources("transfer", {sources:[{agentId: e.agent.id}]}, function(err, adminTransfers) { callback(err, agentTransfers.transfers, adminTransfers); });
					},
					// Good going, now lets check for missing transfers
					function(agentTransfers, adminTransfers, callback) {
						console.log("Got admin transfer list: " + JSON.stringify(adminTransfers));
						// Check for missing transfers (and add if found)
						async.map(adminTransfers, function(transfer, callback) {
							// Check state of transfer
							var found = false;
							for (var i = 0; i < agentTransfers.length && !found; i++) {
								if (agentTransfers[i].id == transfer.id) {
									found = true;
								}
							}
							// Add if needed
							if (! found) {
								console.log("Agent is missing transfer " + transfer.id);
								agentClient.post("/rest/v1/transfers", transfer, callback);
							}
							else {
								callback(null, transfer);
							}
						}, function(err) {
							// Done with adding missing transfers, let's move on
							console.log("Done checking missing transfers " + (err?"with errors":""));
							callback(err, agentTransfers, adminTransfers);
						});
					},
					// Good going, now lets check for incorrect transfers
					function(agentTransfers, adminTransfers, callback) {
						console.log("Check for incorrect transfers");
						// Check for incorrect transfers (and correct if found)
						async.map(agentTransfers, function(transfer, callback) {
							// Check state of transfer
							var adminTransfer;
							for (var i = 0; i < adminTransfers.length && !adminTransfer; i++) {
								if (adminTransfers[i].id == transfer.id) {
									adminTransfer = adminTransfers[i];
								}
							}
							// Remove if needed
							if (! adminTransfer) {
								console.log("Agent has an extra transfer " + transfer.id);
								agentClient.del("/rest/v1/transfers/" + transfer.id, callback);
							}
							// Update if needed
							else if (adminTransfer.version != transfer.version) {
								console.log("Agent has an out of date transfer " + transfer.id);
								agentClient.put("/rest/v1/transfers/" + transfer.id, adminTransfer, callback);
							}
							else {
								callback(null, transfer);
							}
						}, function(err) {
							// Done with adding missing transfers, let's move on
							console.log("Done checking incorrect transfers " + (err?"with errors":""));
							callback(err, agentTransfers, adminTransfers);
						});
					}
				], function(err) {
					console.log("Agent handshake done " + (err ? "with errors" : "successfully"));
				});
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