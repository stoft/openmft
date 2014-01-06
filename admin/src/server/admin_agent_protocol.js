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
			return _.some(a2, function rina2(r2) {
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
		// Keep timeouts for agent state verifications (to avoid there being multitudes of them)
		this.verifyStateTimeouts = {};
		// Subscribe to events from state
		try {
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
		}
		catch (err) {
			console.log("Exception caught in admin_agent_protocol");
			console.log(err);
		}
	};

	//----------------------------
	// Event handlers
	//----------------------------
	// Trigger: admin has started
	// Action: Trigger handleAdminHandshake for all agents
	Protocol.prototype.handleAdminStarted = function() {
		console.log("handleAdminStarted");
		this.state.agent.findResources(null, function iterateAgents(err, agents) {
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
		// Agent state of UNKNOWN will trigger handleAgentVerifyState, see handleAgentUpdated
		this.handleAgentUpdateState(agent, "UNKNOWN");
	};

	// Trigger: An agent has announced itself for the first time
	// Action: Start checking up on the agent from time to time
	Protocol.prototype.handleAgentCreated = function(agent) {
		console.log("handleAgentCreated (agentId: " + agent.id + ")");
		this.handleAgentVerifyState(agent);
	};

	// Trigger: An agent has been updated in admin
	// Trigger: An agent has notified admin about its state
	// Action: If agent is now running, trigger handleAgentVerifyTransfers
	// Hmm, should handleAgentVerifyTransfers be used for both admin updates and transfer diffs?
	Protocol.prototype.handleAgentUpdated = function(agent, old) {
		console.log("handleAgentUpdated (agentId: " + agent.id + ", state: " + agent.state + ", oldState: " + old.state + ")");
		if (agent.state === "RUNNING" && old.state !== "RUNNING") {
			this.handleAgentVerifyTransfers(agent);
		}
		if (agent.state === "UNKNOWN") {
			this.handleAgentVerifyState(agent);
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

	// Trigger: on regular intervals or if specifically requested
	// Action: Get agent status
	Protocol.prototype.handleAgentVerifyState = function(agent) {
		console.log("handleAgentVerifyState (agentId: " + agent.id + ")");
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		agentClient.get("/rest/v1/agents/" + agent.id, function onResponse(err, req, res, obj) {
			if (! err) {
				// console.log("Agent " + agent.id + " should change state from " + agent.state + " to " + obj.agent.state);
				if (agent.state !== obj.agent.state) {
					console.log("Agent " + agent.id + " state changed from " + agent.state + " to " + obj.agent.state);
					this.handleAgentUpdateState(agent, obj.agent.state);
				}
			}
			else {
				this.handleAgentUpdateState(agent, "STOPPED");
			}
			// Schedule another state check in a minute
			if (this.verifyStateTimeouts[agent.id]) {
				clearTimeout(this.verifyStateTimeouts[agent.id]);
			}
			this.verifyStateTimeouts[agent.id] = setTimeout(function verifyState() {
				this.handleAgentVerifyState(agent);
			}.bind(this), 60000);
		}.bind(this));
	};

	// Trigger: on agent status change (admin internally)
	// Action: Update agent.state
	Protocol.prototype.handleAgentUpdateState = function(agent, state) {
		if (agent.state !== state) {
			console.log("handleAgentUpdateState (agentId: " + agent.id + ", state: " + state + ")");
			this.state.agent.updateResource(agent.id, {id: agent.id, version: agent.version, state: state});
		}
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
				this.state.transfer.findResources(function filter(transfer) {
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
					this.handleAgentError(agent, err);
				}
			}.bind(this));
	};

	// Trigger: Synchronizing with agent failed
	// Action: Update agent status in admin
	Protocol.prototype.handleAgentError = function(agent, err) {
		console.log("handleAgentError (agentId: " + agent.id + "): " + err);
		if (agent.state !== "ERROR") {
			this.handleAgentUpdateState(agent, "ERROR");
		}
	};

	// Trigger: A transfer has been created in admin
	// Action: Push the transfer to relevant agents
	Protocol.prototype.handleTransferCreated = function(transfer) {
		console.log("handleTransferCreated (transferId: " + transfer.id + ")");
		// Get array of agent ids
		var agentIds = _.uniq(_.union(
			_.map(transfer.sources, function getAgentId(source) { return source.agentId; }),
			_.map(transfer.targets, function getAgentId(target) { return target.agentId; })
		));
		// Get agents from state
		this.state.agent.findResources(function matchAgents(agent) {
			return _.some(agentIds, function match(id) {
				return agent.id === id;
			});
		}, function tellAgentsAboutTransfer(err, agents) {
			if (! err) {
				for (var i = 0; i < agents.length; i++) {
					this.handleCreateTransferOnAgent(agents[i], transfer);
				}
			}
			else {
				console.log("handleTransferCreated ERROR: Couldn't find matching agents");
			}
		}.bind(this));
	};

	// Trigger: A transfer has been updated on admin
	// Action: Add, update and/or delete the transfer on relevant agents
	// Note: only if version has changed
	Protocol.prototype.handleTransferUpdated = function(transfer, oldTransfer) {
		if (transfer.version !== oldTransfer.version) {
			console.log("handleTransferUpdated (transferId: " + transfer.id + ")");
			// Get array of current agent ids
			var agentIds = _.uniq(_.union(
				_.map(transfer.sources, function getAgentId(source) { return source.agentId; }),
				_.map(transfer.targets, function getAgentId(target) { return target.agentId; })
			));
			// Get array of old agent ids
			var oldAgentIds = _.uniq(_.union(
				_.map(oldTransfer.sources, function getAgentId(source) { return source.agentId; }),
				_.map(oldTransfer.targets, function getAgentId(target) { return target.agentId; })
			));
			// Which agents to add/update/delete?
			var addAgentIds = _.difference(agentIds, oldAgentIds);
			var updateAgentIds = _.intersection(agentIds, oldAgentIds);
			var deleteAgentIds = _.difference(oldAgentIds, agentIds);
			// Add transfer to certain agents
			this.state.agent.findResources(function matchAgents(agent) {
				return _.some(addAgentIds, function match(id) {
					return agent.id === id;
				});
			}, function tellAgentsAboutTransfer(err, agents) {
				if (! err) {
					for (var i = 0; i < agents.length; i++) {
						this.handleCreateTransferOnAgent(agents[i], transfer);
					}
				}
				else {
					console.log("handleTransferUpdated ERROR: Couldn't find matching agents");
				}
			}.bind(this));
			// Update transfer to certain agents
			this.state.agent.findResources(function matchAgents(agent) {
				return _.some(updateAgentIds, function match(id) {
					return agent.id === id;
				});
			}, function tellAgentsAboutTransfer(err, agents) {
				if (! err) {
					for (var i = 0; i < agents.length; i++) {
						this.handleUpdateTransferOnAgent(agents[i], transfer);
					}
				}
				else {
					console.log("handleTransferUpdated ERROR: Couldn't find matching agents");
				}
			}.bind(this));
			// Delete transfer to certain agents
			this.state.agent.findResources(function matchAgents(agent) {
				return _.some(deleteAgentIds, function match(id) {
					return agent.id === id;
				});
			}, function tellAgentsAboutTransfer(err, agents) {
				if (! err) {
					for (var i = 0; i < agents.length; i++) {
						this.handleDeleteTransferOnAgent(agents[i], transfer);
					}
				}
				else {
					console.log("handleTransferUpdated ERROR: Couldn't find matching agents");
				}
			}.bind(this));
		}
	};

	// Trigger: A transfer has been deleted from admin
	// Action: Delete the transfer on relevant agents
	Protocol.prototype.handleTransferDeleted = function(transfer) {
		console.log("handleTransferDeleted (transferId: " + transfer.id + ")");
		// Get array of agent ids
		var agentIds = _.uniq(_.union(
			_.map(transfer.sources, function getAgentId(source) { return source.agentId; }),
			_.map(transfer.targets, function getAgentId(target) { return target.agentId; })
		));
		// Get agents from state
		this.state.agent.findResources(function matchAgents(agent) {
			return _.some(agentIds, function match(id) {
				return agent.id === id;
			});
		}, function tellAgentsAboutTransfer(err, agents) {
			if (! err) {
				for (var i = 0; i < agents.length; i++) {
					this.handleDeleteTransferOnAgent(agents[i], transfer);
				}
			}
			else {
				console.log("handleTransferDeleted ERROR: Couldn't find matching agents");
			}
		}.bind(this));
	};

	// Trigger: A transfer is missing on an agent
	// Action: Push transfer to agent
	Protocol.prototype.handleCreateTransferOnAgent = function(agent, transfer) {
		console.log("handleCreateTransferOnAgent (agentId: " + agent.id + ", transferId: " + transfer.id + ")");
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		agentClient.post("/rest/v1/transfers", transfer, function onResponse(err) {
			if (! err) {
				this.handleTransferSynced(agent, transfer);
				console.log("Created transfer " + transfer.id + " on agent " + agent.id);
			}
			else {
				this.handleAgentError(agent, err);
			}
		}.bind(this));
	};

	// Trigger: A transfer is out-of-date on an agent
	// Action: Update transfer at agent
	Protocol.prototype.handleUpdateTransferOnAgent = function(agent, transfer) {
		console.log("handleUpdateTransferOnAgent (agentId: " + agent.id + ", transferId: " + transfer.id + ")");
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		agentClient.put("/rest/v1/transfers/" + transfer.id, transfer, function onResponse(err) {
			if (! err) {
				this.handleTransferSynced(agent, transfer);
				console.log("Updated transfer " + transfer.id + " on agent " + agent.id);
			}
			else {
				this.handleAgentError(agent, err);
			}
		}.bind(this));
	};

	// Trigger: An agent has a transfer too many
	// Action: Delete transfer at agent
	Protocol.prototype.handleDeleteTransferOnAgent = function(agent, transfer) {
		console.log("handleDeleteTransferOnAgent (agentId: " + agent.id + ", transferId: " + transfer.id + ")");
		var agentClient = restify.createJsonClient({
			url: "http://" + agent.host + ":" + agent.port,
			version: "*"
		});
		agentClient.del("/rest/v1/transfers/" + transfer.id, function onResponse(err) {
			if (! err) {
				console.log("Deleted transfer " + transfer.id + " on agent " + agent.id);
			}
			else {
				this.handleAgentError(agent, err);
			}
		}.bind(this));
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
		console.log("handleTransferOutOfSync (agentId: " + agent.id + ", transferId: " + transfer.id + ", state: " + state + ")");
		if (state !== "DIFFERENT_VERSION") {
			transfer.state = "OUT_OF_SYNC";
			this.state.transfer.updateResource(transfer);
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
					this.handleAgentError(agent, err);
				}
			}.bind(this));
		}
		else if (state === "AGENT_ONLY") {
			agentClient.del("/rest/v1/transfers/" + transfer.id, function synced(err) {
				if (err) {
					this.handleAgentError(agent, err);
				}
			}.bind(this));
		}
		else if (state === "DIFFERENT_VERSION") {
			agentClient.put("/rest/v1/transfers/" + transfer.id, transfer, function synced(err) {
				if (! err) {
					this.handleTransferSynced(agent, transfer);
				}
				else {
					this.handleAgentError(agent, err);
				}
			}.bind(this));
		}
	};

	// Trigger: A previously out-of-sync transfer has been synced with agent
	// Action: Update transfer state to SYNCED
	Protocol.prototype.handleTransferSynced = function(agent, transfer) {
		console.log("handleTransferSynced (agentId: " + agent.id + ", transferId: " + transfer.id + ")");
		// Remove any previous sync references for agent
		var synced = [];
		if (transfer.synced) {
			synced = _.filter(transfer.synced, function notAgent(s) {
				return s.agentId !== agent.id;
			});
		}
		// Add current sync
		synced.push({agentId: agent.id, version: transfer.version});
		// Current state
		var state = "OUT_OF_SYNC";
		var agentCount = transfer.sources.length + transfer.targets.length;
		var syncCount = _.countBy(synced, function countSynced(sync) {
			return sync.version;
		})[transfer.version];
		if (agentCount === syncCount) {
			state = "SYNCHRONIZED";
		}
		// Update sync state
		this.state.transfer.updateResource(transfer.id, {
			id: transfer.id,
			version: transfer.version,
			synced: synced,
			state: state
		});
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(state) {
		return new Protocol(state);
	};
}());