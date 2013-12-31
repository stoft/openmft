//---------------------------------------------------------------------------
// Administrator resource state
// Handles state and persistence on all Administrator resources
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var events = require('events');
	var async = require('async');
	var resourceSet = require('./resource_set.js');

	//----------
	// Functions
	//----------
	var load = function(config, resourceNameArray, stateLoadedCallback) {
		var that = this;
		// ResourceSet state
		var resource_sets = [];
		// ResourceSet object
		var object = {
			// Get a resource set of a certain type
			getResourceSet: function(type) {
				// console.log("state.js: " + what + " " + that + " " + this + " " + resource_sets);
				var rs = null;
				for (var i = 0; i < resource_sets.length && !rs; i++)
					if (resource_sets[i].getResourceType(type) == type)
						rs = resource_sets[i];
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
			// Get all resources of a specific type
			getResources: function(type) {
				return this.getResourceSet(type).listResources();
			},
			// Get all resources
			listResourceSets: function() {
				return resource_sets;
			},
			addResourceSet: function(resourceSet) {
				resource_sets.push(resourceSet);
			}
		}
		//-------------------------
		// Read persisted resources
		//-------------------------
		async.map(resourceNameArray, function(resourceName, callback) {
			// Load resource_set asynchronously
			console.log("[state] Loading resource set: " + resourceName);
			resourceSet.load(config, resourceName, function(set) {
				resource_sets.push(set);
				console.log("[state] Loaded resource set: " + resourceName);
				// Return result asynchronously
				callback(false, set);
			});
		}, function(err, results) {
			// results = array of all loaded resource sets
			if (err)
				console.log("[state] BIG ERROR: couldn't load all resource sets: " + JSON.stringify(err));
			else
				console.log("[state] All resource sets loaded (" + results.length + ")");
			stateLoadedCallback(object);
		});

		return object;
	}

	//---------------
	// Module exports
	//---------------
    module.exports.load = function(config, resourceNameArray, callback) {
        return load(config, resourceNameArray, callback);
    }
}());