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
				state.findResources(type, {}, callback);
			});
			socket.on("add", function(type, data, callback) {
				state.addResource(type, data, callback);
			});
			socket.on("update", function(type, id, data, callback) {
				state.updateResource(type, id, data, callback);
			});
			socket.on("delete", function(type, id, callback) {
				state.deleteResource(type, id, callback);
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

	// Add a resource (asynchronously)
	// State.prototype.addConnection = function(type, data, callback) {
	// 	getResourceSet(this, type).addResource(data, callback);
	// };

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, io) {
        return new SocketInterface(state, io);
    };
}());