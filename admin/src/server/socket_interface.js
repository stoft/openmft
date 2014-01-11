//---------------------------------------------------------------------------
// Administrator state updates
// Handles socket.io updates of resource changes
//---------------------------------------------------------------------------
'use strict';

(function() {
	//-------------
	// Dependencies
	//-------------

	//----------------------------
	// Hidden (internal) functions
	//----------------------------
	function handleEvent(socketInterface, e) {
		// console.log('socket handleEvent: ' + e.eventType + ' ' + e.resourceType)
		for (var i = 0; i < socketInterface.sockets.length; i++) {
			socketInterface.sockets[i].emit(e.eventType, e);
		}
	}

	//-------------
	// State object
	//-------------
	// Constructor. Note that initialization/loading is performed asynchronously
	var SocketInterface = function(io, adminState, agentState) {
		// ResourceSet state
		this.adminState = adminState;
		this.agentState = agentState;
		this.io = io;
		this.sockets = [];
		var resourceSets = {
			agent: adminState.agent,
			transfer: adminState.transfer,
			event: agentState.event
		};
		// Monitor for socket.io connections (WebSocket communication with clients)
		io.of('/socket/v1').on('connection', function(socket) {
			this.sockets.push(socket);
			socket.emit('connect', {some: 'connected'});
			// Subscribe to client requests
			socket.on('list', function(type, callback) {
				resourceSets[type].findResources(null, callback);
			});
			socket.on('add', function(type, data, callback) {
				resourceSets[type].addResource(data, callback);
			});
			socket.on('update', function(type, id, data, callback) {
				resourceSets[type].updateResource(id, data, callback);
			});
			socket.on('delete', function(type, id, callback) {
				resourceSets[type].deleteResource(id, callback);
			});
		}.bind(this));
		// Subscribe to events and publish them to connected sockets
		this.adminState.on('add', function(e) {
			// console.log('socketInterface trying to push event add');
			handleEvent(this, e);
		}.bind(this));
		this.adminState.on('update', function(e) {
			// console.log('socketInterface trying to push event update');
			handleEvent(this, e);
		}.bind(this));
		this.adminState.on('delete', function(e) {
			// console.log('socketInterface trying to push event delete');
			handleEvent(this, e);
		}.bind(this));
		// Subscribe to events and publish them to connected sockets
		this.agentState.on('add', function(e) {
			// console.log('socketInterface trying to push event add');
			handleEvent(this, e);
		}.bind(this));
		this.agentState.on('update', function(e) {
			// console.log('socketInterface trying to push event update');
			handleEvent(this, e);
		}.bind(this));
		this.agentState.on('delete', function(e) {
			// console.log('socketInterface trying to push event delete');
			handleEvent(this, e);
		}.bind(this));
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(io, adminState, agentState) {
        return new SocketInterface(io, adminState, agentState);
    };
}());