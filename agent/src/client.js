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
	var fs = require('fs');
	var restApi = require('./restapi.js');


	//------------
	// Constructor
	//------------	
	var create = function(config) {

		//-----------------------
		// Hidden state variables
		//-----------------------
		var subscriptions = {};
		var configuration = config;

		//------------
		//Internals
		//------------
		function createJsonClient(host, port) {
			return restify.createJsonClient({
				url: 'http://' + host + ':' + port,
				version: '*'
			});
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
			var intervalId = setInterval(getNotifications, 60000, host, port, config);
			subscriptions[agentId] = intervalId;
		}

		function unsubscribe(agentId) {
			var intervalId = subscriptions[agentId];
			clearInterval(intervalId);
			delete subscriptions[agentId];
		}

		function getFile(host, port, notification, callback) {
			console.log(JSON.stringify(notification));
			var index = notification.filename.lastIndexOf('/');
			var filename = notification.filename.substring(index + 1);
			var tmpFolder = (configuration.runtimeDir.charAt(
				configuration.runtimeDir.length - 1) === '/')
			? configuration.runtimeDir
			: configuration.runtimeDir + '/';
			var finalFolder = (configuration.outboundDir.charAt(
				configuration.outboundDir.length - 1) === '/')
			? configuration.outboundDir
			: configuration.runtimeDir + '/';
			var file = fs.createWriteStream(tmpFolder + filename);
			console.log('Created file stream: ' + tmpFolder + filename);
			var client = restify.createClient({ url : 'http://' + host + ':' + port });
			client.get(restApi.NOTIFICATIONS + notification.fileId, function(err, req) {
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
							});
					}
				});
			});
		}

		function moveFile(oldPath, newPath){
			fs.rename(oldPath, newPath, function(err){
				if (err) {
					console.log('Error moving file %s to %s.', oldPath, newPath );
				}
			});
		}

		function deleteNotification(host, port, notification) {
			var client = createJsonClient(host, port);
			client.del(restApi.NOTIFICATIONS + notification.id, function(err, req, res) {
				if(err) {
					console.log('Error deleting notification: ' + JSON.stringify(err));
					throw err;
				}
				// assert.ifError(err);
				console.log('Deleted notification. id: %d, status: %d', notification.id, res.statusCode);
			});
		}

		function processNotifications(host, port, notifications) {
			for (var i = 0; i < notifications.length; i++) {
				getFile(host, port, notifications[i], deleteNotification);
			}
		}

		function getNotifications(host, port, config) {
			var client = createJsonClient(host, port);

			client.get(restApi.NOTIFICATIONS + '?target=' + config.id, function(err, req, res, notifications) {
				if (err) {
					console.log('Could not get notifications: ' + JSON.stringify(err));
				}
				else {
					console.log('Got notifications: %d', Object.keys(notifications).length);
					processNotifications(host, port, notifications);
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
			processNotifications: processNotifications,
			getNotifications: getNotifications,
			reloadConfig : reloadConfig
		};
	};


	//---------------
	// Module exports
	//---------------
    module.exports.create = function(config) {
    	//TODO subscribe to each source.
        return create(config);
    };
}());