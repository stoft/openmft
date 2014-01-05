//---------------------------------------------------------------------------
// Administrator-Agent protocol
// Attempt at event-based distributed processes
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var restify = require("restify");
	var async = require("async");
	var _ = require("underscore");

	//----------------------------
	// Hidden (internal) functions
	//----------------------------

	// Returns an array of objects only in a1 (using id as comparison)
	function difference(a1, a2) {
		return _.filter(a1, function ina2(r1) {
			return !_.some(a2, function rina2(r2) {
				return r1.id === r2.id;
			});
		});
	}

	// Returns an array of a1 objects that exist in a2 as well (using id as comparison)
	function intersection(a1, a2) {
		return _.filter(a1, function ina2(r1) {
			return _.some(a2, function rina2(r2) {
				return r1.id === r2.id;
			});
		});
	}

	// Returns an array of objects that are in both arrays (using id as comparison)
	// but with different versions
	function versionDiffers(a1, a2) {
		var inBoth = intersection(a1, a2);
		return _.filter(inBoth, function ina2(r1) {
			return !_.some(a2, function rina2(r2) {
				return r1.id === r2.id && r1.version !== r2.version;
			});
		});
	}

	//-------------------
	// Protocol object
	//-------------------
	// Constructor. Initializes/Loads resources asynchronously
	var Protocol = function(state) {
		// Protocol state
		this.state = state;
		// Subscribe to events from state
		this.state.on("add", function onAdd(resource) {
			if (resource.resourceType === "agent") {
				this.handleAgentCreated(resource.agent);
			}
			else if (resource.resourceType === "transfer") {
				this.handleTransferCreated(resource.transfer);
			}
		}.bind(this));
		this.state.on("update", function onUpdate(resource, old) {
			if (resource.resourceType === "agent") {
				this.handleAgentUpdated(resource.agent, old);
			}
			else if (resource.resourceType === "transfer") {
				this.handleTransferUpdated(resource.transfer, old);
			}
		}.bind(this));
		this.state.on("delete", function onDelete(resource, old) {
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
	// Trigger: admin has started
	// Action: Trigger handleAdminHandshake for all agents
	Protocol.prototype.handleAdminStarted = function() {
		console.log("handleAdminStarted");
		this.state.findResources("agent", null, function iterateAgents(err, agents) {
			if (! err) {
				for (var i = 0; i < agents.length; i++) {
					this.handleAdminHandshake(agents[i]);
				}
			}
		}.bind(this));
	};

	// Trigger: on admin startup
	// Action: Update agent.state to UNKNOWN
	// Action: Trigger handleAgentVerifyState
	Protocol.prototype.handleAdminHandshake = function(agent) {
		console.log("handleAdminHandshake (agentId: " + agent.id + ")");
		this.handleAgentUpdateState(agent, "UNKNOWN");
		this.handleAgentVerifyState(agent);
	};

	// Trigger: An agent has announced itself for the first time
	// Action: None
	Protocol.prototype.handleAgentCreated = function(agent) {
		console.log("handleAgentCreated (agentId: " + agent.id + ")");
		// Not implemented
	};

	// Trigger: An agent has been updated in admin
	// Trigger: An agent has notified admin about its state
	// Action: If agent is now running, trigger handleAgentVerifyTransfers
	// Hmm, should handleAgentVerifyTransfers be used for both admin updates and transfer diffs?
	Protocol.prototype.handleAgentUpdated = function(agent, old) {
		console.log("handleAgentUpdated (agentId: " + agent.id + ")");
		if (agent.state == "RUNNING" && old.state != "RUNNING") {
			this.handleAgentVerifyTransfers(agent);
		}
	};

	// Trigger: An agent has been deleted in admin
	// Action: Delete any related transfers
	// Action: Notify the agent in question
	Protocol.prototype.handleAgentDeleted = function(agent) {
		console.log("handleAgentDeleted (agentId: " + agent.id + ")");
		// Not implemented
		agent.state = "DELETED";
	};

	// Trigger: on regular intervals
	// Action: Get agent status
	Protocol.prototype.handleAgentVerifyState = function(agent) {
		console.log("handleAgentVerifyState (agentId: " + agent.id + ")");
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		agentClient.get("/rest/v1/agents/" + agent.id, function onResponse(err, req, res, obj) {
			if (! err) {
				if (agent.state !== obj.state) {
					this.handleAgentUpdateState(agent, obj.state);
				}
			}
			else {
				this.handleAgentError(agent);
			}
		}.bind(this));
	};

	// Trigger: on agent status change (admin internally)
	// Action: Update agent.state
	Protocol.prototype.handleAgentUpdateState = function(agent, state) {
		console.log("handleAgentUpdateState (agentId: " + agent.id + ")");
		this.state.updateResource("agent", agent.id, {id: agent.id, version: agent.version, state: state});
	};

	// Trigger: on startup of agent and/or admin
	// Action: Retrieve transfers from admin and agent and pass on to handleTransferCompare
	Protocol.prototype.handleAgentVerifyTransfers = function(agent) {
		console.log("handleAgentVerifyTransfers (agentId: " + agent.id + ")");
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		var agentTransfers;
		var adminTransfers;
		async.parallel([
			function getAgentTransfers(callback) {
				agentClient.get("/rest/v1/transfers", function onResponse(err, req, res, obj) {
					if (! err) {
						agentTransfers = obj.transfers;
					}
					callback(err);
				});
			},
			function getAdminTransfers(callback) {
				// Get transfers that have the agent as either a source or a target
				this.state.findResources("transfer", function filter(transfer) {
					return _.some(transfer.sources, function match(source) {
						return source.agentId === agent.id;
					}) ||
					_.some(transfer.targets, function match(target) {
						return target.agentId === agent.id;
					});
				}, function(err, result) {
					adminTransfers = result;
					callback(err);
				});
			}.bind(this)
			], function compare(err) {
				if (! err) {
					this.handleTransferCompare(agent, adminTransfers, agentTransfers);
				}
				else {
					this.handleAgentError(agent);
				}
			}.bind(this));
	};

	// Trigger: Synchronizing with agent failed
	// Action: Update agent status in admin
	Protocol.prototype.handleAgentError = function(agent) {
		console.log("handleAgentError (agentId: " + agent.id + ")");
		if (agent.state !== "ERROR") {
			this.handleAgentUpdateState(agent, "ERROR");
		}
	};

	Protocol.prototype.handleTransferCreated = function(transfer) {
		console.log("handleTransferCreated (transferId: " + transfer.id + ")");
		// Not implemented
	};

	Protocol.prototype.handleTransferUpdated = function(transfer) {
		console.log("handleTransferUpdated (transferId: " + transfer.id + ")");
		// Not implemented
	};

	Protocol.prototype.handleTransferDeleted = function(transfer) {
		console.log("handleTransferDeleted (transferId: " + transfer.id + ")");
		// Not implemented
	};

	// Trigger: Agent and Admin transfers should be compared and corrected
	// Action: Send out-of-sync transfers to handleTransferOutOfSync
	Protocol.prototype.handleTransferCompare = function(agent, adminTransfers, agentTransfers) {
		console.log("handleTransferCompare (agentId: " + agent.id + ")");
		var onlyInAdmin = difference(adminTransfers, agentTransfers);
		var onlyInAgent = difference(agentTransfers, adminTransfers);
		var differs = versionDiffers(adminTransfers, agentTransfers);
		for (var i = 0; i < onlyInAdmin.length; i++) {
			this.handleTransferOutOfSync(agent, onlyInAdmin[i], "ADMIN_ONLY");
		}
		for (var j = 0; j < onlyInAgent.length; j++) {
			this.handleTransferOutOfSync(agent, onlyInAgent[j], "AGENT_ONLY");
		}
		for (var k = 0; k < differs.length; k++) {
			this.handleTransferOutOfSync(agent, differs[k], "DIFFERENT_VERSION");
		}
	};

	// Trigger: A transfer is out-of-sync between admin and agent
	// Action: Update transfer state to OUT_OF_SYNC
	// Action: Add transfers to agent
	// Action: Update transfers on agent
	// Action: Remove transfers from agent
	// Action: Send successfully synced transfers to handleTransferSynced
	// state is one of AGENT_ONLY, ADMIN_ONLY or DIFFERENT_VERSION
	Protocol.prototype.handleTransferOutOfSync = function(agent, transfer, state) {
		console.log("handleTransferOutOfSync (agentId: " + agent.id + ", transferId: " + transfer.id + ")");
		if (state !== "DIFFERENT_VERSION") {
			// Can't perform state update before state machine is update to not emit events on state changes
			// Otherwise we will be stuck in infinite update loops
			// transfer.state = "OUT_OF_SYNC";
			// this.state.updateResource("transfer", transfer);
			console.log("Can't update transfer state to OUT_OF_SYNC");
		}
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		if (state === "ADMIN_ONLY") {
			agentClient.post("/rest/v1/transfers", transfer, function synced(err) {
				if (! err) {
					this.handleTransferSynced(agent, transfer);
				}
				else {
					this.handleAgentError(agent);
				}
			});
		}
		else if (state === "AGENT_ONLY") {
			agentClient.del("/rest/v1/transfers/" + transfer.id, function synced(err) {
				if (err) {
					this.handleAgentError(agent);
				}
			});
		}
		else if (state === "DIFFERENT_VERSION") {
			agentClient.put("/rest/v1/transfers/" + transfer.id, transfer, function synced(err) {
				if (! err) {
					this.handleTransferSynced(agent, transfer);
				}
				else {
					this.handleAgentError(agent);
				}
			});
		}
	};

	// Trigger: A previously out-of-sync transfer has been synced with agent
	// Action: Update transfer state to SYNCED
	Protocol.prototype.handleTransferSynced = function(agent, transfer) {
		console.log("handleTransferSynced (agentId: " + agent.id + ", transferId: " + transfer.id + ")");
		// Not implemented
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(state) {
		return new Protocol(state);
	};
}());