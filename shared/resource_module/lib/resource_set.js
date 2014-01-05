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
	var _ = require("underscore");
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
	var ResourceSet = function(definition, master, callback) {
		// ResourceSet state
		this.definition = definition;
		this.master = master;
		this.resourceType = definition.resourceType;
		this.filename = definition.filename;
		this.resources = [];
		this.idCounter = 1;
		loadResourceSet(this, callback);
	};
	// Add eventing
	util.inherits(ResourceSet, EventEmitter);

	// Return the resource type name
	ResourceSet.prototype.getResourceType = function() {
		return this.resourceType;
	};
	// Getter for whether a specific property should update a resource version
	ResourceSet.prototype.shouldUpdateVersion = function(key) {
		return _.some(this.definition.properties, function contains(p) {
			return p.name === key && p.updatesVersion === true;
		});
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
	ResourceSet.prototype.findResources = function(filter, callback) {
		if (filter) {
			callback(null, _.filter(this.resources, filter));
		}
		else {
			callback(null, this.resources);
		}
	};
	// Add a resource (asynchronously)
	ResourceSet.prototype.addResource = function(data, callback) {
		// ToDo: Validate data
		// ToDo: Map data to admin structure
		if (this.master) {
			// Generate unique id
			data.id = this.idCounter++;
			// Create resource version
			data.version = 1;
		}
		this.resources.push(data);
		this.persist(data, "add", null, callback);
	};
	// Update a resource (asynchronously)
	ResourceSet.prototype.updateResource = function(id, data, callback) {
		async.waterfall([
			// Get current version of resource
			function getResource(callback) {
				this.getResource(id, callback);
			}.bind(this),
			// Verify version = current
			function verifyVersion(resource, callback) {
				if (this.master && resource.version != data.version) {
					callback(new restify.ConflictError("Not allowed to update " + this.getResourceType() + "/" + id +
						" (current version: " + resource.version + ") with out-of-date version (" + data.version + ")"));
				}
				else {
					callback(null, resource);
				}
			}.bind(this),
			// Update resource
			function updateResource(resource, callback) {
				// Take a copy for the emitted event
				var copy = deepCopy(resource);
				var updateVersion = false;
				for (var key in data) {
					// Do not allow updates of id
					if (key != "id" && data.hasOwnProperty(key)) {
						// Master will not update version from external sources
						if (!this.master || key != "version") {
							resource[key] = data[key];
							updateVersion = updateVersion || this.shouldUpdateVersion(key);
						}
					}
				}
				if (this.master && updateVersion) {
					resource.version++;
				}
				callback(null, resource, copy);
			}.bind(this),
			// Persist changes
			function persistChanges(resource, copy, callback) {
				this.persist(resource, "update", copy, callback);
			}.bind(this)
		], function reportResults(err, result) {
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
	module.exports.create = function(definition, master, callback) {
		return new ResourceSet(definition, master, callback);
	};
}());