define(["knockout", "async"], function (ko, async) {
    "use strict";

    // Set up socket connection to server
    var socket = io.connect("/socket/v1");

    // Create state object (singleton)
    var state = {
        isInitialized: ko.observable(false),
        transfers: ko.observableArray([]),
        agents: ko.observableArray([]),

        setLoading: function (isInitialized) {
            this.isInitialized(isInitialized);
        },
        addAgent: function (agent) {
            this.agents.push(agent);
        },
        addTransfer: function (transfer) {
            this.transfers.push(transfer);
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
    socket.on("connect", function (e) {
        console.log("socket: connected to server: " + e);
    });
    socket.on("add", function (e) {
        console.log("socket: added: " + e);
        if (e.resourceType === "transfer") {
            state.addTransfer(e.transfer);
        }
        else if (e.resourceType === "agent") {
            state.addAgent(e.agent);
        }
    });
    socket.on("update", function (e) {
        console.log("socket: updated: " + e);
    });
    socket.on("delete", function (e) {
        console.log("socket: deleted: " + e);
    });
    
    // Return state object (singleton)
    return state;
});