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
	var load = function(config, resourceName, callback) {
		// ResourceSet state
		var that = this;
		var filename = null;
		var resources = [];
		var idCounter = 1;
		// ResourceSet object
		var object = {
			// Return the resource type name
			getResourceType: function() {
				return resourceName;
			},
			// Get array index of a resource
			getResourceIndex: function(id) {
				var index = -1;
				for (var i = 0; i < resources.length && index == -1; i++)
					if (resources[i].id == id)
						index = i;
				return index;
			},
			// Get a resource with a specific id
			getResource: function(id) {
				return resources[this.getResourceIndex(id)];
			},
			// Get all resources
			listResources: function() {
				return resources;
			},
			// Add a resource
			addResource: function(data) {
				// ToDo: Validate data
				// ToDo: Map data to admin structure
				// Generate unique id
				data.id = idCounter++;
				// Create resource version
				data.version = 1;
				resources.push(data);
				this.persist();
				return data;
			},
			// Update a resource
			updateResource: function(id, data) {
				var resource = this.getResource(id);
				if (! resource)
					throw new Error("Resource not found, update failed");
				// ToDo: Validate data
				// Validate version (to avoid out-of-sync updates)
				if (resource.version != data.version)
					throw new Error("Out-of-date update blocked");
				// ToDo: Map data to admin structure
				for (key in data) {
					if (key != "id" && key != "version") {
						// console.log("Updating " + key + " from " + resource[key] + " to " + data[key]);
						resource[key] = data[key];
					}
				}
				resource.version++;
				this.persist();
				return resource;
			},
			// Remove a resource with a specific id
			deleteResource: function(id) {
				resources.splice(this.getResourceIndex(id), 1);
				this.persist();
			},
			// Persist resource set to file
			persist: function() {
			  	fs.writeFile(filename, JSON.stringify(resources), function(err) {
			  		if (err)
			  			throw new Error("[resource_set] BIG ERROR: Could not write resource set state to disk");
			  	});
			}
		}

		//-------------------------
		// Read persisted resources
		//-------------------------
		filename = config.runtimeDir + "/" + resourceName + ".json";
		console.log("[resource_set] Loading " + resourceName + "s: " + filename);
		// Read resource_set asynchronously
		fs.readFile(filename, function(err, data) {
			if (! err) {
				resources = JSON.parse(data);
				console.log("[resource_set] Loaded " + resourceName + "s (" + resources.length + ")");
				// Return loaded result set object asynchronously
				if (callback)
					callback(object);
			}
			else {
			  	// Write a fresh resources files (error most likely to file being missing...)
			  	fs.writeFile(filename, JSON.stringify(resources), function(err) {
			  		if (err)
			  			console.log("[resource_set] BIG ERROR: Could not write resource set state to disk");
			  		console.log("[resource_set] Created new " + resourceName + " file");
			  		if (callback)
			  			callback(object);
			  	});
			}
		});

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
		// 	console.log("Writing agent config to: " + filename);
		// 	fs.writeFile(filename, JSON.stringify(resources));
		// 	res.send("ok");
		// });

		return object;
	}

	//---------------
	// Module exports
	//---------------
    module.exports.load = function(config, resourceName, callback) {
        return load(config, resourceName, callback);
    }
}());