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
	var fs = require("fs");
	var resourceSet = require("./resource_set.js");

	//----------------------------
	// Hidden (internal) functions
	//----------------------------

	//-------------
	// State object
	//-------------
	// Constructor. Note that initialization/loading is performed asynchronously
	var State = function(options, callback) {
		// ResourceSet state
		this._resourceSets = [];
		this._persistenceDirectory = "/tmp";
		// Read options
		if (options && options.persistenceDirectory) {
			this._persistenceDirectory = options.persistenceDirectory;
		}
		// Create directory if it doesn't exist
		if (! fs.existsSync(this._persistenceDirectory)) {
			fs.mkdirSync(this._persistenceDirectory);
		}
		// Initialize/load resource sets asynchronously
		async.map(options.resourceSets, function(resourceSetOptions, callback) {
			// Load a single resource set, send callback to let async know the results
			if (! resourceSetOptions.filename) {
				resourceSetOptions.filename = this._persistenceDirectory + "/" + resourceSetOptions.resourceType + ".json";
			}
			this[resourceSetOptions.resourceType] = resourceSet.create(resourceSetOptions, options.master, callback);
			return this[resourceSetOptions.resourceType];
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
				this._resourceSets = results;
				// Subscribe to changes (resubmit them)
				for (var i = 0; i < this._resourceSets.length; i++) {
					this._resourceSets[i].on("add", this.handleResourceAdded.bind(this));
					this._resourceSets[i].on("update", this.handleResourceUpdated.bind(this));
					this._resourceSets[i].on("delete", this.handleResourceDeleted.bind(this));
				}
				console.log("State initialized/loaded (" + this._resourceSets.length + ")");
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

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(options, callback) {
        return new State(options, callback);
    };
}());