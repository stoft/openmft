//---------------------------------------------------------------------------
// Administrator server
// Started by mimosa
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var restify = require('restify');
	var path = require('path');
	var filed = require('filed');
	var fs = require('fs');
	var mime = require('mime');
	var restInterface = require('./rest_interface.js');

	//-----------------------------------
	// Initialize and start admin process
	//-----------------------------------
	var startServer = function(mimosaConfig, callback) {
		console.log("Working Directory: " + process.cwd());

		//-------------------------
		// Read admin configuration
		//-------------------------
		var expectedVersion = 0.1;
		var configFile = path.resolve('../../etc/current/config.json');
		console.log("Reading configuration file: " + configFile);
		var config = JSON.parse(fs.readFileSync(configFile));
		if (config.version != expectedVersion) {
			console.log("Mismatch of agent binary and configuration versions: " + expectedVersion + " != " + config.version + ", exiting");
			process.exit(1);
		}

		//-------------------------
		// Read agent state
		//-------------------------
		var agentsFile = config.runtimeDir + "/agents.json";
		console.log("Reading agents file: " + agentsFile);
		var agents = [];
		try {
			agents = JSON.parse(fs.readFileSync(agentsFile));
		}
		catch (e) {
		  	// Write a fresh agents files (error most likely to file being missing...)
		  	fs.writeFileSync(agentsFile, JSON.stringify(agents));
		}

		// Initialize server
		var server = restInterface.create(config, agents);

		// Mimosa wants us to invoke the callback
		callback(server);
	}

	//---------------
	// Module exports
	//---------------
    module.exports.startServer = function(mimosaConfig, callback) {
        return startServer(mimosaConfig, callback);
    }
}());