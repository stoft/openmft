//---------------------------------------------------------------------------
// Administrator resource state
// Handles state and persistence on all Administrator resources
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var async = require("async");
	var resourceSet = require("./resource_set.js");

	//----------
	// Functions
	//----------
	var load = function(config, resourceNameArray, stateLoadedCallback) {
		// ResourceSet state
		var resourceSets = [];
		// ResourceSet object
		var object = {
			// Get a resource set of a certain type
			getResourceSet: function(type) {
				// console.log("state.js: " + what + " " + that + " " + this + " " + resourceSets);
				var rs = null;
				for (var i = 0; i < resourceSets.length && !rs; i++) {
					if (resourceSets[i].getResourceType(type) == type) {
						rs = resourceSets[i];
					}
				}
				return rs;
			},
			// Get a resource of a specific type and id
			addResource: function(type, data) {
				return this.getResourceSet(type).addResource(data);
			},
			// Get a resource of a specific type and id
			getResource: function(type, id) {
				return this.getResourceSet(type).getResource(id);
			},
			// Get a resource of a specific type and id
			updateResource: function(type, id, data) {
				return this.getResourceSet(type).updateResource(id, data);
			},
			// Get a resource of a specific type and id
			deleteResource: function(type, id) {
				return this.getResourceSet(type).deleteResource(id);
			},
			// Get all resources of a specific type
			getResources: function(type) {
				return this.getResourceSet(type).listResources();
			},
			// Get all resources
			listResourceSets: function() {
				return resourceSets;
			},
			addResourceSet: function(resourceSet) {
				resourceSets.push(resourceSet);
			}
		};

		//-------------------------
		// Read persisted resources
		//-------------------------
		async.map(resourceNameArray, function(resourceName, callback) {
			// Load resource_set asynchronously
			console.log("[state] Loading resource set: " + resourceName);
			resourceSet.load(config, resourceName, function(set) {
				resourceSets.push(set);
				console.log("[state] Loaded resource set: " + resourceName);
				// Return result asynchronously
				callback(false, set);
			});
		}, function(err, results) {
			// results = array of all loaded resource sets
			if (err) {
				console.log("[state] BIG ERROR: couldn't load all resource sets: " + JSON.stringify(err));
			}
			else {
				console.log("[state] All resource sets loaded (" + results.length + ")");
			}
			stateLoadedCallback(object);
		});

		return object;
	};

	//---------------
	// Module exports
	//---------------
    module.exports.load = function(config, resourceNameArray, callback) {
        return load(config, resourceNameArray, callback);
    };
}());