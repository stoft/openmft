'use strict';
//---------------------------------------------------------------------------
// Client
// Provides the client functionality between the agent process
// and the the rest of the OpenMFT network
// The client will actively call other MFT agents.
//---------------------------------------------------------------------------

// Basic process:

// 1. get notifications
// 2. for each notification:
// 	a. parse notification
// 	b. get file
// 	c. write file to disc
// 	d. delete notification


// consider creating a file context object with events
// such as :
// downloaded
// moved

(function() {

	//-------------
	// Dependencies
	//-------------
	var restify = require('restify');
	var _ = require('underscore');
	var fs = require('fs');
	var path = require('path');
	var restApi = require('./restapi.js');


	//------------
	// Constructor
	//------------	
	var create = function(config, agentState, adminState) {

		//-----------------------
		// Hidden state variables
		//-----------------------
		var subscriptions = {};
		var configuration = config;
		// var adminState = adminState;

		onStart();

		//------------
		// Subscribe to adminState events
		//------------

		adminState.agent.on('add', function onAdd(resource) {
			agentCreated(resource.agent);
		});
		adminState.agent.on('update', function onUpdate(resource, old) {
			agentUpdated(resource.agent, old);
		});
		adminState.agent.on('delete', function onDelete(resource, old) {
			agentDeleted(old);
		});
		adminState.transfer.on('add', function onAdd(resource) {
			transferCreated(resource.transfer);
		});
		adminState.transfer.on('update', function onUpdate(resource, old) {
			transferUpdated(resource.transfer, old);
		});
		adminState.transfer.on('delete', function onDelete(resource, old) {
			transferDeleted(old);
		});
		agentState.file.on('add', function onAdd(resource) {
			var file = resource.file;
			console.log('File '+file.id+' added, lets create notifications');
			// Log an event that we received a file
			agentState.event.addResource({
				time: new Date(),
				type: 'FileReceived',
				agent: config.id,
				transfer: file.transferId,
				file: file.id
			});
			adminState.transfer.getResource(file.transferId, function getTransfer(err, transfer) {
				if (err) {
					throw new Error('Couldnt get transfer ' + file.transferId);
				}
				_.each(transfer.targets, function createNotification(target) {
					console.log('Creating notification for ' + target.agentId);
					agentState.notification.addResource({
						fileId: file.id,
						filename : file.path,
						source: config.id,
						target : target.agentId,
						transfer : transfer.id
					});
				});
			});
		});
		agentState.notification.on('delete', function onDelete(id, notification) {
			if (notification.source === config.id) {
				console.log('Notification deleted, lets see if the file should be deleted');
				agentState.notification.findResources(function sameFile(n) {
					return notification.fileId === n.fileId;
				}, function (err, notifications) {
					if (! err && notifications.length === 0) {
						console.log('No notifications left for the file, lets delete it');
						agentState.file.deleteResource(notification.fileId);
						fs.unlink(notification.filename);
					}
				});
			}
		});
		agentState.notification.on('add', function onAdd(resource) {
			console.log('Notification added: ' + resource.notification.id);
			processNotification(resource.notification);
		});
		agentState.event.on('add', function onAdd(resource) {
			console.log('Event added: ' + resource.event.id);
			pushEventToAdmin(resource.event);
		});

		//------------
		//Internals
		//------------
		function createJsonClient(host, port) {
			return restify.createJsonClient({
				url: 'http://' + host + ':' + port,
				version: '*'
			});
		}

		function onStart() {
			adminState.transfer.findResources(null , function load(err, transfers) {
				if (err) {
					console.log('client.onStart error: ' + JSON.stringify(err));
				}
				else {
					_.each(transfers, loadTransfer);
				}
			});
		}

		function loadTransfer(transfer) {
			if (_.some(transfer.targets, function us(target) {
				return target.agentId === config.id;
			})) {
				console.log('We are the target!');
				var sourceAgentIds = _.map(transfer.sources, function getId(source) {
					return source.agentId;
				});
				adminState.agent.findResources(function(agent) {
					// console.log('Compare ' + agent.id + ' to ' + JSON.stringify(sourceAgentIds));
					return _.some(sourceAgentIds, function inSources(sourceAgentId) {
						return agent.id === sourceAgentId;
					});
				}, function foundSourceAgents(err, sourceAgents) {
					console.log('We now have a list of source agents: ' + sourceAgents.length);
					_.each(sourceAgents, function doSubscribe(agent) {
						console.log('Subscribe to agent ' + agent.id);
						subscribe(agent.id, agent.host, agent.port);
					});
				});
			}
		}

		function agentCreated(agent) {
			console.log('agentCreated: ' + agent.id);
		}
		function agentUpdated(agent, old) {
			console.log('agentUpdated: ' + agent.id);
		}
		function agentDeleted(agent) {
			console.log('agentDeleted: ' + agent.id);
		}
		function transferCreated(transfer) {
			console.log('transferCreated: ' + transfer.id + ' we are ' + config.id);
			loadTransfer(transfer);
		}
		function transferUpdated(transfer, old) {
			console.log('transferUpdated: ' + transfer.id);
		}
		function transferDeleted(transfer) {
			console.log('transferDeleted: ' + transfer.id);
		}

		//------------
		// Exported
		//------------

		function reloadConfig(newConfig) {
			configuration = newConfig;
			//TODO add/modify new subscriptions
			//TODO remove old subscriptions
		}

		function subscribe(agentId, host, port) {
			console.log('client.subscribe ' + agentId + ' ' + host + ' ' + port);
			var intervalId = setInterval(getNotifications, 60000, host, port, config);
			subscriptions[agentId] = intervalId;
		}

		function unsubscribe(agentId) {
			var intervalId = subscriptions[agentId];
			clearInterval(intervalId);
			delete subscriptions[agentId];
		}

		function getFile(host, port, notification, transfer, callback) {
			// console.log(JSON.stringify(notification));
			var index = notification.filename.lastIndexOf('/');
			var filename = notification.filename.substring(index + 1);
			var tmpFolder = (configuration.runtimeDir.charAt(
				configuration.runtimeDir.length - 1) === '/') ?
					configuration.runtimeDir :
					configuration.runtimeDir + '/';
			var finalFolder = (configuration.outboundDir.charAt(
				configuration.outboundDir.length - 1) === '/') ?
					configuration.outboundDir :
					configuration.outboundDir + '/';
			finalFolder += transfer.name + '/';
			var file = fs.createWriteStream(tmpFolder + filename);
			console.log('Created file stream: ' + tmpFolder + filename);
			var client = restify.createClient({ url : 'http://' + host + ':' + port });
			client.get(restApi.FILES + '/' + notification.fileId, function(err, req) {
				if(err) {
					console.log('Error performing request: ' + JSON.stringify(err));
					throw err;
				}

				req.on('result', function(err, res) {
					if(err) {
						console.log('Error reading response: ' + JSON.stringify(err));
						throw err;
					}
					else {
						res.pipe(file);
						file
							.on('finish', function() {
								file.close(); callback(host, port, notification);
							})
							.on('finish', function() {
								moveFile(tmpFolder + filename, finalFolder + filename);
							})
							.on('finish', function() {
								agentState.notification.deleteResource(notification.id);
								// Log an event that we successfully transferred a file
								agentState.event.addResource({
									time: new Date(),
									type: 'FileTransferred',
									agent: config.id,
									transfer: transfer.id,
									file: notification.fileId
								});
							});
					}
				});
			});
		}

		function moveFile(oldPath, newPath){
			console.log('Moving file %s to %s.', oldPath, newPath );
			if ( !fs.existsSync(path.dirname(newPath)) ) {
				fs.mkdirSync(path.dirname(newPath));
			}
			fs.rename(oldPath, newPath, function(err){
				if (err) {
					console.log('Error moving file %s to %s.', oldPath, newPath );
				}
			});
		}

		function deleteNotification(host, port, notification) {
			var client = createJsonClient(host, port);
			client.del(restApi.NOTIFICATIONS + '/' + notification.id, function(err, req, res) {
				if(err) {
					console.log('Error deleting notification: ' + JSON.stringify(err));
					throw err;
				}
				// assert.ifError(err);
				console.log('Deleted notification. id: %s, status: %d', notification.id, res.statusCode);
			});
		}

		function processNotification(notification) {
			if (notification.source != config.id) {
				// Lets get the file!
				// console.log('processNotification: ' + JSON.stringify(notification));
				// Get agent
				var source = adminState.agent.getResourceSync(notification.source);
				// Get transfer
				var transfer = adminState.transfer.getResourceSync(notification.transfer);
				// Get file
				getFile(source.host, source.port, notification, transfer, deleteNotification);
			}
			else {
				// Lets push the notification to it's target!
				var target = adminState.agent.getResourceSync(notification.target);
				var client = createJsonClient(target.host, target.port);
				client.post(restApi.NOTIFICATIONS, notification, function(err, req, res) {
					if(err) {
						console.log('Failed to push notification: ' + JSON.stringify(err));
					}
					else {
						console.log('Pushed notification. id: %s, status: %d', notification.id, res.statusCode);
					}
				});
			}
		}
		// function processNotifications(host, port, notifications) {
		// 	for (var i = 0; i < notifications.length; i++) {
		// 		adminState.transfer.getResource(notifications[i].transfer, function getTransfer(err, transfer) {
		// 			getFile(host, port, notifications[i], transfer, deleteNotification);
		// 		});
		// 	}
		// }

		function getNotifications(host, port, config) {
			var client = createJsonClient(host, port);
			// console.log('client.getNotifications ' + host + ' ' + port);

			client.get(restApi.NOTIFICATIONS + '?target=' + config.id, function(err, req, res, obj) {
				if (err) {
					console.log('Could not get notifications: ' + JSON.stringify(err));
				}
				else {
					if (obj.notifications.length > 0) {
						console.log('Got notifications: %d', Object.keys(obj.notifications).length);
						// Add to state, events will fire processNotification
						_.each(obj.notifications, function process(notification) {
							agentState.notification.addResource(notification);
						});
					}
				}
			});
		}

		// Lets push the event to admin
		function pushEventToAdmin(event) {
			var client = createJsonClient(config.adminHost, config.adminPort);
			client.post(restApi.EVENTS, event, function(err, req, res) {
				if(err) {
					console.log('Failed to push event: ' + JSON.stringify(err));
				}
				else {
					console.log('Pushed event. id: %s, status: %d', event.id, res.statusCode);
				}
			});
		}

		//-----------------------
		// Return the newly created instance
		//-----------------------
		return {
			subscribe: subscribe,
			unsubscribe: unsubscribe,
			getFile: getFile,
			deleteNotification: deleteNotification,
			// processNotifications: processNotifications,
			getNotifications: getNotifications,
			reloadConfig : reloadConfig
		};
	};


	//---------------
	// Module exports
	//---------------
	module.exports.create = function(config, agentState, adminState) {
		//TODO subscribe to each source.
		return create(config, agentState, adminState);
	};
}());