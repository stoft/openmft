var clientModule = require('./client.js');

var client = clientModule.create({id : 1});

var tmpNotification = {
		id : 1,
		version : 1,
		source : 1,
		target : 2,
		transfer : 1,
		fileId : 1,
		filename : "/foo/bar/baz.txt"
};

var notifications = [];
notifications.push(tmpNotification);

// client.getNotifications("localhost", 3301, function(host, port, obj){
// 	// console.log("Got notifications: " + JSON.stringify(obj));
// });

// client.deleteNotification("localhost", 3301, tmpNotification);

// // client.processNotification("localhost", 3301, 1);

// client.getFile("localhost", 3301, tmpNotification, function(host, port, notification){
// 	// console.log(host + port + notification);
// });

// client.processNotification("localhost", 3301, tmpNotification);

// client.processNotifications("localhost", 3301, notifications);

// client.getNotifications("localhost", 3301, {id: 1});

client.subscribe(1, "localhost", 3301);