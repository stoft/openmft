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
	var stateModule = require('./state.js');

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
			console.log("Mismatch of admin binary and configuration versions: " + expectedVersion + " != " + config.version + ", exiting");
			process.exit(1);
		}

		//-------------------------
		// Load resource state
		//-------------------------
		stateModule.load(config, ['agent', 'transfer'], function(loadedState) {
			// Initialize server
			var server = restInterface.create(config, loadedState);

			// Mimosa wants us to invoke the callback
			callback(server);
		});
	}

	//---------------
	// Module exports
	//---------------
    module.exports.startServer = function(mimosaConfig, callback) {
        return startServer(mimosaConfig, callback);
    }
}());