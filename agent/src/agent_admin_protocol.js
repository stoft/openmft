//---------------------------------------------------------------------------
// Agent-Admin protocol
// Attempt at event-based distributed processes
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var restify = require("restify");
	// var async = require("async");
	// var _ = require("underscore");

	//----------------------------
	// Hidden (internal) functions
	//----------------------------

	//-------------------
	// Protocol object
	//-------------------
	// Constructor. Initializes/Loads resources asynchronously
	var Protocol = function(config, state, adminState) {
		this.config = config;
		this.state = state;
		this.adminState = adminState;
		// Subscribe to events from adminState
		this.adminState.on("add", function onAdd(resource) {
			if (resource.resourceType === "agent") {
				this.handleAgentCreated(resource.agent);
			}
			else if (resource.resourceType === "transfer") {
				this.handleTransferCreated(resource.transfer);
			}
		}.bind(this));
		this.adminState.on("update", function onUpdate(resource, old) {
			if (resource.resourceType === "agent") {
				this.handleAgentUpdated(resource.agent, old);
			}
			else if (resource.resourceType === "transfer") {
				this.handleTransferUpdated(resource.transfer, old);
			}
		}.bind(this));
		this.adminState.on("delete", function onDelete(resource, old) {
			if (resource.resourceType === "agent") {
				this.handleAgentDeleted(old);
			}
			else if (resource.resourceType === "transfer") {
				this.handleTransferDeleted(old);
			}
		}.bind(this));
	};

	//----------------------------
	// Event handlers
	//----------------------------
	// Trigger: agent has started
	// Action: Find our own id from adminState
	// Action: Trigger handleAgentHandshake
	Protocol.prototype.handleAgentStarted = function() {
		console.log("handleAgentStarted");
		this.adminState.findResources("agent", function matchOurself(agent) {
			return this.config.host === agent.host && this.config.port === agent.port;
		}.bind(this), function matchedOrNot(err, result) {
			if (! err && result && result.length > 0) {
				this.config.id = result[0].id;
				this.config.version = result[0].version;
				if (this.config.name !== result[0].name) {
					console.log("WARN: Agent found itself in adminState, but with different name (" +
						this.config.name + " != " + result[0].name + ")");
				}
			}
			this.handleAgentHandshake();
		}.bind(this));
	};

	// Trigger: on agent startup
	// Action: If id exists - notify admin with agent.status = RUNNING
	// Action: If id doesn't exists - notify admin with new agent
	Protocol.prototype.handleAgentHandshake = function() {
		console.log("handleAgentHandshake");
		if (this.config.id) {
			this.handleNotifyAdminAboutAgent();
		}
		else {
			this.handleAgentDoesntExist();
		}
	};

	// Trigger: Agent startup
	// Action: Notify admin with agent status
	Protocol.prototype.handleNotifyAdminAboutAgent = function() {
		console.log("handleNotifyAdminAboutAgent");
		var adminClient = restify.createJsonClient({
			url: "http://" + this.config.adminHost + ":" + this.config.adminPort,
			version: "*"
		});
		adminClient.put("/rest/v1/agents/" + this.config.id, {
			id: this.config.id,
			version: this.config.version,
			state: "RUNNING"
		}, function onResponse(err) {
			if (! err) {
				console.log("Notified admin about running state successfully");
			}
			else {
				this.handleUnrecoverableError("Failed to notify admin about running state");
			}
		}.bind(this));
	};

	// Trigger: Admin doesn't know about me
	// Action: Notify admin with new agent
	Protocol.prototype.handleAgentDoesntExist = function() {
		console.log("handleAgentDoesntExist");
		var adminClient = restify.createJsonClient({
			url: "http://" + this.config.adminHost + ":" + this.config.adminPort,
			version: "*"
		});
		adminClient.post("/rest/v1/agents", {
			name: this.config.name,
			host: this.config.host,
			port: this.config.port,
			inboundDir: this.config.inboundDir,
			outboundDir: this.config.outboundDir,
			state: "RUNNING"
		}, function onResponse(err, req, res, obj) {
			if (! err) {
				// Update our adminState with ourself
				var adminAgent = obj.agent;
				this.adminState.addResource("agent", adminAgent);
				// Update our config with id and version and persist it
				this.config.id = adminAgent.id;
				this.config.version = adminAgent.version;
				console.log("Registered agent successfully with administrator");
			}
			else {
				this.handleUnrecoverableError("Failed to register agent with administrator");
			}
		}.bind(this));
	};

	// Trigger: An unrecoverable error occurred
	// Action: We should crash, but for now, lets just log it
	Protocol.prototype.handleUnrecoverableError = function(message) {
		console.log("handleUnrecoverableError: " + message);
	};


	//---------------
	// Module exports
	//---------------
	module.exports.create = function(config, state, adminState) {
		return new Protocol(config, state, adminState);
	};
}());