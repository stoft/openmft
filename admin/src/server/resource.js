//---------------------------------------------------------------------------
// Resource
// Handles state and persistence on a resource for Administrator
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var path = require('path');
	var fs = require('fs');
	var events = require('events');

	//-----------------------------------
	// Internal functions
	//-----------------------------------
	//-----------------------------------
	// Initialize and start agent process
	//-----------------------------------
	var startServer = function(mimosaConfig, callback) {
		console.log("Working Directory: " + process.cwd());

		//-------------------------
		// Read admin configuration
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


		server.put('/rest/agent/:id', function(req, res, next) {
			console.log("Agent checked in ("+req.params.id+"): " + JSON.stringify(req.body));
			// Update agents array/file
			var newAgents = [];
			for (var i = 0; i < agents.length; i++) {
				if (agents[i].id != req.body.id)
					newAgents.push(agents[i]);
			}
			newAgents.push(req.body);
			agents = newAgents;
			console.log("Writing agent config to: " + agentsFile);
			fs.writeFile(agentsFile, JSON.stringify(agents));
			res.send("ok");
		});

	}

	//---------------
	// Module exports
	//---------------
    module.exports.startServer = function(mimosaConfig, callback) {
        return startServer(mimosaConfig, callback);
    }
}());