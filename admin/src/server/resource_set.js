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
	var restify = require("restify");

	//----------------------------
	// Hidden (internal) functions
	//----------------------------
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
	// Get a resource with a specific id
	ResourceSet.prototype.getResource = function(id) {
		return this.resources[getResourceIndex(id)];
	};
	// Get all resources
	ResourceSet.prototype.listResources = function() {
		return this.resources;
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
		this.persist(data, callback);
	};
	// Update a resource (asynchronously) (asynchronously)
	ResourceSet.prototype.updateResource = function(id, data, callback) {
		var resource = this.getResource(id);
		if (! resource) {
			if (callback) {
				callback(new restify.ResourceNotFoundError("Could not find resource " + id + " of type " + this.getResourceType()));
			}
			return;
		}
		// ToDo: Validate data
		// Validate version (to avoid out-of-sync updates)
		if (resource.version != data.version) {
			if (callback) {
				callback(new restify.ConflictError("Not allowed to update " + this.getResourceType() + "/" + id +
					" (current version: " + resource.version + ") with out-of-date version (" + data.version + ")"));
			}
			return;
		}
		// ToDo: Map data to admin structure
		// Update resource with updated values
		for (var key in data) {
			// Do not allow updates of id and version
			if (key != "id" && key != "version") {
				resource[key] = data[key];
			}
		}
		resource.version++;
		this.persist(resource, callback);
	};
	// Remove a resource with a specific id (asynchronously)
	ResourceSet.prototype.deleteResource = function(id, callback) {
		this.resources.splice(getResourceIndex(id), 1);
		this.persist(id, callback);
	};
	// Persist resource set to file (asynchronously)
	ResourceSet.prototype.persist = function(result, callback) {
		fs.writeFile(this.filename, JSON.stringify(this.resources), function(err) {
			if (callback) {
				if (err) {
					callback(err, "Could not write resource set state to disk");
				}
				else {
					callback(null, result);
				}
			}
		});
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(options, callback) {
		return new ResourceSet(options, callback);
	};
}());