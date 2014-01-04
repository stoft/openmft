//---------------------------------------------------------------------------
// Resource Set
// Handles state and persistence on a set of resources for Administrator
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var fs = require("fs");
	var EventEmitter = require("events").EventEmitter;
	var util = require("util");
	var async = require("async");
	var restify = require("restify");

	//----------------------------
	// Hidden (internal) functions
	//----------------------------
	// Copy a resource
	function deepCopy(resource) {
		return JSON.parse(JSON.stringify(resource));
	}
	// Get array index of a resource
	function getResourceIndex(resourceSet, id) {
		var index = -1;
		for (var i = 0; i < resourceSet.resources.length && index == -1; i++) {
			if (resourceSet.resources[i].id == id) {
				index = i;
			}
		}
		return index;
	}
	function matchesFilter(object, filter) {
		var match = true;
		// console.log("rs.matchesFilter 1 " + JSON.stringify(filter));
		for (var key in filter) {
			if (filter.hasOwnProperty(key)) {
				// console.log("rs.matchesFilter 3 " + key + " " + JSON.stringify(filter[key]));
				if (Object.prototype.toString.call(filter[key]) === "[object Array]") {
					// Require the object to contain the filter values
					// console.log("rs.matchesFilter array " + key + " " + filter[key].length + " ==  " + object[key].length);
					for (var i = 0; i < filter[key].length && match; i++) {
						var found = false;
						for (var j = 0; j < object[key].length && !found; j++) {
							if (typeof filter[key] == "object") {
								found = matchesFilter(object[key][j], filter[key][i]);
							}
							else {
								found = filter[key][i] == object[key][j];
							}
						}
						if (! found) {
							match = false;
						}
					}
				}
				else if (typeof filter[key] == "string" ||
					typeof filter[key] == "boolean" ||
					typeof filter[key] == "number") {
					// console.log("rs.matchesFilter " + filter[key] + " ==  " + object[key]);
					if (filter[key] != object[key]) {
						match = false;
					}
				}
				else {
					// console.log("rs.matchesFilter unmatched filter type " + (typeof filter[key]) + " " + Object.prototype.toString.call(filter[key]));
					match = false;
				}
			}
		}
		// console.log("rs.matchesFilterEnd " + match + " " + JSON.stringify(filter));
		return match;
	}
	// Load a resource set from file (or create an empty file)
	function loadResourceSet(resourceSet, callback) {
		console.log("Loading " + resourceSet.getResourceType() + "s: " + resourceSet.filename);
		// Read resource_set asynchronously
		fs.readFile(resourceSet.filename, function(err, data) {
			if (! err) {
				resourceSet.resources = JSON.parse(data);
				// Update idCounter
				for (var i = 0; i < resourceSet.resources.length; i++) {
					if (resourceSet.resources[i].id >= resourceSet.idCounter) {
						resourceSet.idCounter = resourceSet.resources[i].id + 1;
					}
				}
				console.log("Loaded " + resourceSet.getResourceType() + "s (" + resourceSet.resources.length + ")");
				// Return loaded result set object asynchronously
				if (callback) {
					callback(null, resourceSet);
				}
			}
			else {
				// Write a fresh resources files (error most likely to file being missing...)
				fs.writeFile(resourceSet.filename, JSON.stringify([]), function(err) {
					if (callback) {
						if (err) {
							callback(new restify.InternalServerError("Could not persist resource set"));
						}
						else {
							console.log("Created new " + resourceSet.getResourceType() + " file");
							callback(null, resourceSet);
						}
					}
				});
			}
		});
}

	//-------------------
	// ResourceSet object
	//-------------------
	// Constructor. Initializes/Loads resources asynchronously
	var ResourceSet = function(options, callback) {
		// ResourceSet state
		this.resourceType = options.resourceType;
		this.filename = options.filename;
		this.resources = [];
		this.idCounter = 1;
		if (options && options.idCounter) {
			this.idCounter = options.idCounter;
		}
		loadResourceSet(this, callback);
	};
	// Add eventing
	util.inherits(ResourceSet, EventEmitter);

	// Return the resource type name
	ResourceSet.prototype.getResourceType = function() {
		return this.resourceType;
	};
	// Get a resource with a specific id (asynchronously)
	ResourceSet.prototype.getResource = function(id, callback) {
		var resource = this.resources[getResourceIndex(this, id)];
		if (resource) {
			callback(null, resource);
		}
		else {
			callback(new restify.ResourceNotFoundError("Could not find resource " + id + " of type " + this.getResourceType()));
		}
	};
	// Get all resources (asynchronously)
	// ResourceSet.prototype.listResources = function(callback) {
	// 	callback(null, this.resources);
	// };
	// Get all resources (asynchronously)
	ResourceSet.prototype.findResources = function(filter, callback) {
		async.filter(this.resources, function(resource, callback) {
			// Exclude if a filter key doesn't match
			var match = matchesFilter(resource, filter);
			// for (var key in filter) {
			//   if (filter.hasOwnProperty(key) && filter.key != resource.key) {
			//     match = false;
			//   }
			// }
			callback(match);
		}, function(result) {
			callback(null, result);
		});
	};
	// Add a resource (asynchronously)
	ResourceSet.prototype.addResource = function(data, callback) {
		// ToDo: Validate data
		// ToDo: Map data to admin structure
		// Generate unique id
		data.id = this.idCounter++;
		// Create resource version
		data.version = 1;
		this.resources.push(data);
		this.persist(data, "add", null, callback);
	};
	// Update a resource (asynchronously)
	ResourceSet.prototype.updateResource = function(id, data, callback) {
		async.waterfall([
			// Get current version of resource
			function(callback) {
				this.getResource(id, callback);
			}.bind(this),
			// Verify version = current
			function(resource, callback) {
				if (resource.version != data.version) {
					callback(new restify.ConflictError("Not allowed to update " + this.getResourceType() + "/" + id +
						" (current version: " + resource.version + ") with out-of-date version (" + data.version + ")"));
				}
				else {
					callback(null, resource);
				}
			}.bind(this),
			// Update resource
			function(resource, callback) {
				// Take a copy for the emitted event
				var copy = deepCopy(resource);
				for (var key in data) {
					// Do not allow updates of id and version
					if (key != "id" && key != "version") {
						resource[key] = data[key];
					}
				}
				resource.version++;
				callback(null, resource, copy);
			}.bind(this),
			// Persist changes
			function(resource, copy, callback) {
				this.persist(resource, "update", copy, callback);
			}.bind(this)
			], function(err, result) {
			// Call original callback
			if (callback) {
				callback(err, result);
			}
		}.bind(this));
};
	// Remove a resource with a specific id (asynchronously)
	ResourceSet.prototype.deleteResource = function(id, callback) {
		var resource = this.resources[getResourceIndex(this, id)];
		this.resources.splice(getResourceIndex(this, id), 1);
		this.persist(id, "delete", resource, callback);
	};
	// Persist resource set to file (asynchronously)
	ResourceSet.prototype.persist = function(result, eventName, copy, callback) {
		fs.writeFile(this.filename, JSON.stringify(this.resources), function(err) {
			if (callback) {
				if (err) {
					callback(err, "Could not write resource set state to disk");
				}
				else {
					// Emit an event for the change
					var e = {
						eventType: eventName,
						resourceType: this.getResourceType()
					};
					e[this.getResourceType()] = result;
					this.emit(eventName, e, copy);
					// Callback
					callback(null, result);
				}
			}
		}.bind(this));
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(options, callback) {
		return new ResourceSet(options, callback);
	};
}());