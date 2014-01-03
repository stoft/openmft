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

//-------------
// Dependencies
//-------------

var restify = require('restify');
var http = require('http');
var fs = require('fs');

//------------
//Internals
//------------
function createJsonClient(host, port) {
	return restify.createJsonClient({
		url: "http://" + host + ":" + port,
		version: '*'
	});
}

function removeSubscription(hostname, port) {
	return "Not implemented.";
}

function getFile(host, port, notification, callback) {
	console.log(JSON.stringify(notification));
	var index = notification.filename.lastIndexOf("/");
	var filename = notification.filename.substring(index + 1);
	var folder = "/var/tmp/openmft/"; //TODO config
	var file = fs.createWriteStream(folder + filename);
	console.log("Created file stream: " + folder + filename);
	var client = restify.createClient({ url : "http://" + host + ":" + port });
	client.get('/rest/v1/files/' + notification.fileId, function(err, req) {
		if(err) {
			console.log("Error performing request: " + JSON.stringify(err));
			throw err;
		}

		req.on('result', function(err, res) {
			if(err) {
				console.log("Error reading response: " + JSON.stringify(err));
				throw err;
			}
			else {
				res.pipe(file);
				file.on('finish', function(){ file.close(); callback(host, port, notification); });
			}
		});
	});
}

function deleteNotification(host, port, notification) {
	var client = createJsonClient(host, port);
	client.del('/rest/v1/notifications/' + notification.id, function(err, req, res) {
		if(err) {
			console.log("Error deleting notification: " + JSON.stringify(err));
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

	client.get("/rest/v1/notifications?target=" + config.id, function(err, req, res, notifications) {
		if (err) {
			console.log("Could not get notifications: " + JSON.stringify(err));
		}
		else {
			console.log("Got notifications: %d", Object.keys(notifications).length);
			processNotifications(host, port, notifications);
		}
	});
}

(function() {

	//------------
	// Constructor
	//------------	
	var create = function(config) {

		//-----------------------
		// Hidden state variables
		//-----------------------
		var subscriptions = {};


		//-----------------------
		// Return the newly created instance
		//-----------------------
		return {
			addSubscription: function(agentId, host, port) {
				var intervalId = setInterval(getNotifications, 60000, host, port, config);
				subscriptions[agentId] = intervalId;
			},
			removeSubscription: function(agentId) {
				var intervalId = subscriptions[agentId];
				clearInterval(intervalId);
				delete subscriptions[agentId];
			},
			getFile: getFile,
			deleteNotification: deleteNotification,
			processNotifications: processNotifications,
			getNotifications: getNotifications
		};
	};


	//---------------
	// Module exports
	//---------------
    module.exports.create = function(config) {
        return create(config);
    }
}());