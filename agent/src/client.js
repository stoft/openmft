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

(function() {
	//-------------
	// Dependencies
	//-------------
	var restify = require('restify');
	var fs = require('fs');

	//------------
	// Constructor
	//------------	
	var create = function(state, config) {

		//-----------------------
		// Hidden state variables
		//-----------------------
		var subscriptions = [];


		//-----------------------
		// Functions
		//-----------------------
		var addSubscription = function(hostname, port) {

			return "Not implemented.";
		};

		var removeSubscription = function(hostname, port) {
			return "Not implemented.";
		};

		var createJsonClient = function(host, port) {
			return restify.createJsonClient({
				url: "http://" + host + ":" + port,
				version: '*'
			});
		};

		var getNotifications = function(host, port, callback) {
			var client = createJsonClient(host, port);

			client.get("/notification" + config.id, config, function(err, req, res, obj) {
				if (err) {
					console.log("Could not get notifications: " + err);
				}
				else {
					console.log("Got %s notifications.", Object.keys(obj).length)
					callback(obj);
				}
			};

			return "Not implemented.";
		};


		var deleteNotification = function(host, port, notificationId) {
			var client = createJsonClient(host, port);
			client.del('/notification/' + notificationId, function(err, req, res) {
				assert.ifError(err);
				console.log('%d -> %j', res.statusCode, res.headers);
			});
		};

		var processNotifications = function(input) {
			var notifications = JSON.parse(input);
			for (notification in notifications) {
				processNotification(notification)
			}
		};

		var processNotification = function(notification) {
			var index = notification.filename.lastIndexOf("/");
			var filename = notification.filename.substring(index);
			var folder = "/var/tmp/openmft/"; //TODO config

			var file = fs.createWriteStream(folder + filename);
			var client = restify.createClient(notification.host, notification.port);


			, data, function(err){
				if(err)
					console.log("Failed to retrieve file: " + notification.filename);
				else {					
					console.log("Downloaded file successfully.");
					deleteNotification(deleteNotification);
				}
			});

			fs.writeFile(filename, );

			return "Not implemented.";
		};




	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());