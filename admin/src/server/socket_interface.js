//---------------------------------------------------------------------------
// Administrator state updates
// Handles socket.io updates of resource changes
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------

	//----------------------------
	// Hidden (internal) functions
	//----------------------------
	function handleEvent(socketInterface, e) {
		// console.log("socket handleEvent: " + e.eventType + " " + e.resourceType)
		for (var i = 0; i < socketInterface.sockets.length; i++) {
			socketInterface.sockets[i].emit(e.eventType, e);
		}
	}

	//-------------
	// State object
	//-------------
	// Constructor. Note that initialization/loading is performed asynchronously
	var SocketInterface = function(state, io) {
		// ResourceSet state
		this.state = state;
		this.io = io;
		this.sockets = [];
		// Monitor for socket.io connections (WebSocket communication with clients)
		io.of("/socket/v1").on("connection", function(socket) {
			this.sockets.push(socket);
			socket.emit("connect", {some: "connected"});
			// Subscribe to client requests
			socket.on("list", function(type, callback) {
				state[type].findResources(null, callback);
			});
			socket.on("add", function(type, data, callback) {
				state[type].addResource(data, callback);
			});
			socket.on("update", function(type, id, data, callback) {
				state[type].updateResource(id, data, callback);
			});
			socket.on("delete", function(type, id, callback) {
				state[type].deleteResource(id, callback);
			});
		}.bind(this));
		// Subscribe to events and publish them to connected sockets
		this.state.on("add", function(e) {
			// console.log("socketInterface trying to push event add");
			handleEvent(this, e);
		}.bind(this));
		this.state.on("update", function(e) {
			// console.log("socketInterface trying to push event update");
			handleEvent(this, e);
		}.bind(this));
		this.state.on("delete", function(e) {
			// console.log("socketInterface trying to push event delete");
			handleEvent(this, e);
		}.bind(this));
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, io) {
        return new SocketInterface(state, io);
    };
}());