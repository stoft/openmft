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
	var EventEmitter = require("events").EventEmitter;
	var util = require("util");
	var resourceSet = require("./resource_set.js");

	//----------------------------
	// Hidden (internal) functions
	//----------------------------
	// Get array index of a resource
	function getResourceSetIndex(state, type) {
		var index = -1;
		for (var i = 0; i < state.resourceSets.length && index == -1; i++) {
			if (state.resourceSets[i].getResourceType() == type) {
				index = i;
			}
		}
		return index;
	}
	// Get a specific resource set
	function getResourceSet(state, type) {
		var result = state.resourceSets[getResourceSetIndex(state, type)];
		return result;
	}

	//-------------
	// State object
	//-------------
	// Constructor. Note that initialization/loading is performed asynchronously
	var State = function(options, callback) {
		// ResourceSet state
		this.resourceSets = [];
		this.persistenceDirectory = "/tmp";
		// Read options
		if (options && options.persistenceDirectory) {
			this.persistenceDirectory = options.persistenceDirectory;
		}
		// Initialize/load resource sets asynchronously
		async.map(options.resourceSets, function(resourceSetOptions, callback) {
			// Load a single resource set, send callback to let async know the results
			if (! resourceSetOptions.filename) {
				resourceSetOptions.filename = this.persistenceDirectory + "/" + resourceSetOptions.resourceType + ".json";
			}
			return resourceSet.create(resourceSetOptions, callback);
		}.bind(this), function(err, results) {
			if (err) {
				// At least one of the resource sets failed to initialize/load
				console.log("Failed to initialize/load state: " + err);
				this.emit("error", "Failed to initialize/load state: " + err);
				if (callback) {
					callback(err);
				}
			}
			else {
				// All resource sets are now initialized/loaded successfully
				this.resourceSets = results;
				// Subscribe to changes (resubmit them)
				for (var i = 0; i < this.resourceSets.length; i++) {
					this.resourceSets[i].on("add", this.handleResourceAdded.bind(this));
					this.resourceSets[i].on("update", this.handleResourceUpdated.bind(this));
					this.resourceSets[i].on("delete", this.handleResourceDeleted.bind(this));
				}
				console.log("State initialized/loaded (" + this.resourceSets.length + ")");
				this.emit("initialized", this);
				if (callback) {
					callback(null, this);
				}
			}
		}.bind(this));
	};
	// Add eventing to state object
	util.inherits(State, EventEmitter);

	// Emit events
	State.prototype.handleResourceAdded = function(resource, copy) {
		this.emit("add", resource, copy);
	};
	State.prototype.handleResourceUpdated = function(resource, copy) {
		this.emit("update", resource, copy);
	};
	State.prototype.handleResourceDeleted = function(resource, copy) {
		this.emit("delete", resource, copy);
	};
	// Add a resource (asynchronously)
	State.prototype.addResource = function(type, data, callback) {
		getResourceSet(this, type).addResource(data, callback);
	};
	// Get a resource of a specific type and id
	State.prototype.getResource = function(type, id, callback) {
		getResourceSet(this, type).getResource(id, callback);
	};
	// Update a resource (asynchronously)
	State.prototype.updateResource = function(type, id, data, callback) {
		getResourceSet(this, type).updateResource(id, data, callback);
	};
	// Delete a resource (asynchronously)
	State.prototype.deleteResource = function(type, id, callback) {
		getResourceSet(this, type).deleteResource(id, callback);
	};
	// Get all resources of a specific type
	// State.prototype.getResources = function(type, callback) {
	// 	getResourceSet(this, type).listResources(callback);
	// };
	// Get all resources of a specific type
	State.prototype.findResources = function(type, filter, callback) {
		getResourceSet(this, type).findResources(filter, callback);
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(options, callback) {
        return new State(options, callback);
    };
}());