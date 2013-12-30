//---------------------------------------------------------------------------
// Resource Set
// Handles state and persistence on a set of resources for Administrator
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var path = require('path');
	var fs = require('fs');
	var events = require('events');

	//----------
	// Functions
	//----------
	var load = function(config, resourceName) {
		//-------------------------
		// Read persisted resources
		//-------------------------
		var resourceFilename = config.runtimeDir + "/" + resourceName + ".json";
		console.log("Loading " + resourceName + "s: " + resourceFilename);
		var resources = [];
		try {
			resources = JSON.parse(fs.readFileSync(resourceFilename));
		}
		catch (e) {
		  	// Write a fresh resources files (error most likely to file being missing...)
		  	fs.writeFileSync(resourceFilename, JSON.stringify(resources));
		}

		// server.put('/rest/agent/:id', function(req, res, next) {
		// 	console.log("Agent checked in ("+req.params.id+"): " + JSON.stringify(req.body));
		// 	// Update resources array/file
		// 	var newAgents = [];
		// 	for (var i = 0; i < resources.length; i++) {
		// 		if (resources[i].id != req.body.id)
		// 			newAgents.push(resources[i]);
		// 	}
		// 	newAgents.push(req.body);
		// 	resources = newAgents;
		// 	console.log("Writing agent config to: " + resourceFilename);
		// 	fs.writeFile(resourceFilename, JSON.stringify(resources));
		// 	res.send("ok");
		// });

		return {
			// Get a resource with a specific id
			get: function(id) {
				return "Not implemented yet";
			}
			// Get all resources
			list: function() {
				return resources;
			}
			// Add a resource (update if resource already exists)
			add: function(resource) {
				return "Not implemented yet";
			}
			// Remove a resource with a specific id
			remove: function(id) {
				return "Not implemented yet";
			}
		}
	}

	//---------------
	// Module exports
	//---------------
    module.exports.load = function(config, resourceName) {
        return load(config, resourceName);
    }
}());