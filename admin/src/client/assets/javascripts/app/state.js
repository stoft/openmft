define(["knockout", "async"], function(ko, async) {
    "use strict";

    // Set up socket connection to server
    var socket = io.connect("/socket/v1");

    // Create state object (singleton)
    var state = {
        isInitialized: ko.observable(false),
        transfers: ko.observableArray([]),
        agents: ko.observableArray([]),

        setLoading: function(isInitialized) {
            this.isInitialized(isInitialized);
        },
        sort: function(a) {
            // a.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1) });
            a.sort(function(left, right) { return left.name.localeCompare(right.name); });
        },
        addAgent: function(agent) {
            this.agents.push(agent);
            this.sort(this.agents);
        },
        addTransfer: function(transfer) {
            this.transfers.push(transfer);
            this.sort(this.transfers);
        },
        updateAgent: function(agent) {
            this.agents.remove(function(a) { return a.id == agent.id; });
            this.agents.push(agent);
            this.sort(this.agents);
        },
        updateTransfer: function(transfer) {
            this.transfers.remove(function(a) { return a.id == transfer.id; });
            this.transfers.push(transfer);
            this.sort(this.transfers);
        },
        removeAgent: function(agent, fromServer) {
            if (fromServer) {
                this.agents.remove(function(a) { return a.id == agent; });
            }
            else {
                socket.emit("delete", "agent", agent.id, function(err, result) {
                    if (err) {
                        console.log("Failed to remove agent: " + err);
                    }
                    else {
                        console.log("Remove agent succeeded: " + JSON.stringify(result));
                    }
                });
            }
        },
        removeTransfer: function(transfer, fromServer) {
            if (fromServer) {
                this.transfers.remove(function(a) { return a.id == transfer; });
            }
            else {
                socket.emit("delete", "transfer", transfer.id, function(err, result) {
                    if (err) {
                        console.log("Failed to remove transfer: " + err);
                    }
                    else {
                        console.log("Remove transfer succeeded: " + JSON.stringify(result));
                    }
                });
            }
        },
        saveTransfer: function(transfer) {
            if (transfer.id && transfer.id > 0) {
                // Update
                socket.emit("update", "transfer", transfer.id, transfer, function(err, result) {
                    if (err) {
                        console.log("Failed to update transfer: " + err);
                    }
                    else {
                        console.log("Update transfer succeeded: " + JSON.stringify(result));
                    }
                });
            }
            else {
                // Create
                socket.emit("add", "transfer", transfer, function(err, result) {
                    if (err) {
                        console.log("Failed to add transfer: " + err);
                    }
                    else {
                        console.log("Create transfer succeeded: " + JSON.stringify(result));
                    }
                });
            }
        },
        getAgent: function(id) {
            var result = "No agent with id " + id + " found";
            for (var i = 0; i < this.agents().length; i++) {
                if (this.agents()[i].id == id) {
                    result = this.agents()[i];
                }
            }
            return result;
        }
    };

    // Initialize current state
    async.parallel([
        // Get transfers
        function(callback) {
            socket.emit("list", "transfer", function(err, result) {
                if (! err) {
                    console.log("Got transfer list (" + result.length + ")");
                    for (var i = 0; i < result.length; i++) {
                        state.addTransfer(result[i]);
                    }
                    callback(null);
                }
                else {
                    callback(err);
                }
            });
        },
        // Get agents
        function(callback) {
            socket.emit("list", "agent", function(err, result) {
                if (! err) {
                    console.log("Got agents list (" + result.length + ")");
                    for (var i = 0; i < result.length; i++) {
                        state.addAgent(result[i]);
                    }
                    callback(null);
                }
                else {
                    callback(err);
                }
            });
        }
    ], function(err) {
        if (! err) {
            state.isInitialized(true);
            console.log("Initialized and ready");
        }
        else {
            console.log("Initialization failed");
            console.warn(err);
        }
    });
    // Subscribe to events from server
    socket.on("connect", function(e) {
        console.log("socket: connected to server: " + e);
    });
    socket.on("add", function(e) {
        console.log("socket: added: " + e);
        if (e.resourceType === "transfer") {
            state.addTransfer(e.transfer);
        }
        else if (e.resourceType === "agent") {
            state.addAgent(e.agent);
        }
    });
    socket.on("update", function(e) {
        console.log("socket: updated: " + e);
        if (e.resourceType === "transfer") {
            state.updateTransfer(e.transfer);
        }
        else if (e.resourceType === "agent") {
            state.updateAgent(e.agent);
        }
    });
    socket.on("delete", function(e) {
        console.log("socket: deleted: " + e);
        if (e.resourceType === "transfer") {
            state.removeTransfer(e.transfer, true);
        }
        else if (e.resourceType === "agent") {
            state.removeAgent(e.agent, true);
        }
    });
    
    // Return state object (singleton)
    return state;
});