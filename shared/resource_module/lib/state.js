//---------------------------------------------------------------------------
// Administrator resource state
// Handles state and persistence on all Administrator resources
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var _ = require("underscore");
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
	// Constructor.
	var State = function(options) {
		// ResourceSet state
		this._persistenceDirectory = "/tmp";
		// Read options
		if (options && options.persistenceDirectory) {
			this._persistenceDirectory = options.persistenceDirectory;
		}
		// Create directory if it doesn't exist
		if (! fs.existsSync(this._persistenceDirectory)) {
			fs.mkdirSync(this._persistenceDirectory);
		}
		// Initialize/load resource
		_.each(options.resourceSets, function(resourceSetOptions) {
			// Load a single resource set, send callback to let async know the results
			if (! resourceSetOptions.filename) {
				resourceSetOptions.filename = this._persistenceDirectory + "/" + resourceSetOptions.resourceType + ".json";
			}
			var rs = resourceSet.create(resourceSetOptions, options.master, options.distributed);
			rs.on("add", this.handleResourceAdded.bind(this));
			rs.on("update", this.handleResourceUpdated.bind(this));
			rs.on("delete", this.handleResourceDeleted.bind(this));
			this[resourceSetOptions.resourceType] = rs;
		}.bind(this));
		console.log("State initialized/loaded");
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
    module.exports.create = function(options) {
        return new State(options);
    };
}());