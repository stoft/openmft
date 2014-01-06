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
	var _ = require("underscore");

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
		this.adminState.agent.findResources(function matchOurself(agent) {
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
				this.adminState.agent.addResource(adminAgent);
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

	// Trigger: A agent has been created on admin
	// Action: ToDo
	Protocol.prototype.handleAgentCreated = function(agent) {
		console.log("handleAgentCreated (agentId: " + agent.id + ")");
		// Not implemented
	};

	// Trigger: A agent has been updated on admin
	// Action: ToDo 
	Protocol.prototype.handleAgentUpdated = function(agent) {
		console.log("handleAgentUpdated (agentId: " + agent.id + ")");
		// Not implemented
	};

	// Trigger: A agent has been deleted from admin
	// Action: ToDo
	Protocol.prototype.handleAgentDeleted = function(agent) {
		console.log("handleAgentDeleted (agentId: " + agent.id + ")");
		// Not implemented
	};

	// Trigger: A transfer has been created on admin
	// Action: Verify (and possible fetch) that we know of the relevant agents
	Protocol.prototype.handleTransferCreated = function(transfer) {
		console.log("handleTransferCreated (transferId: " + transfer.id + ")");
		this.handleFetchTransferAgents(transfer);
		// ToDo: act on transfer...
	};

	// Trigger: A transfer has been updated on admin
	// Action: Verify (and possible fetch) that we know of the relevant agents
	Protocol.prototype.handleTransferUpdated = function(transfer) {
		console.log("handleTransferUpdated (transferId: " + transfer.id + ")");
		this.handleFetchTransferAgents(transfer);
		// ToDo: act on transfer...
	};

	// Trigger: A transfer has been deleted from admin
	// Action: ToDo
	Protocol.prototype.handleTransferDeleted = function(transfer) {
		console.log("handleTransferDeleted (transferId: " + transfer.id + ")");
		// Not implemented
		// ToDo: act on transfer...
	};

	// Trigger: A transfer has been modified
	// Action: Verify (and possible fetch) that we know of the relevant agents 
	Protocol.prototype.handleFetchTransferAgents = function(transfer) {
		console.log("handleFetchTransferAgents (transferId: " + transfer.id + ")");
		// Get array of agent ids
		var agentIds = _.uniq(_.union(
			_.map(transfer.sources, function getAgentId(source) { return source.agentId; }),
			_.map(transfer.targets, function getAgentId(target) { return target.agentId; })
		));
		// Get agents from state (the ones we have)
		this.adminState.agent.findResources(function matchAgents(agent) {
			return _.some(agentIds, function match(id) {
				return agent.id === id;
			});
		}, function agentsThatWeHave(err, agents) {
			if (! err) {
				// Now, lets find out which ones we don't have knowledge about
				_.each(agentIds, function inAgentIds(agentId) {
					if (!_.find(agents, function inAgents(agent) { return agent.id === agentId; })) {
						this.handleFetchAgent(agentId);
					}
				}.bind(this));
			}
			else {
				console.log("handleFetchTransferAgents ERROR: Couldn't find matching agents");
				console.log(err);
			}
		}.bind(this));
	};

	// Trigger: A transfer has been modified and an agent is currently not known
	// Action: Get an agent from admin
	Protocol.prototype.handleFetchAgent = function(agentId) {
		console.log("handleFetchAgent (agentId: " + agentId + ")");
		var adminClient = restify.createJsonClient({
			url: "http://" + this.config.adminHost + ":" + this.config.adminPort,
			version: "*"
		});
		adminClient.get("/rest/v1/agents/" + agentId, function onResponse(err, req, res, obj) {
			if (! err) {
				// Yeay, we got the agent, now let's store it internally
				this.adminState.agent.addResource(obj.agent);
				console.log("Fetched agent " + agentId + " successfully");
			}
			else {
				console.log("Failed to fetch agent " + agentId);
				console.log(err);
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