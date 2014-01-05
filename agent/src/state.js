'use strict';
//---------------------------------------------------------------------------
// Provides state for the running agent process
// Only used internally in the agent instance
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------

	//------------
	// Constructor
	//------------	
	var create = function() {
		//-----------------------
		// Hidden state variables
		//-----------------------
		var notifications = [];
		var files = [];
		var fileCounter = 0;
		var notificationCounter = 0;

		function getNotifications(target) {
			var results = [];
			for(var i = 0; i < notifications.length; i++) {
				if(notifications[i].target == target) {
					results.push(notifications[i]);
				}
			}
			return results;
		}

		function getNotification( id ) {
			return notifications[getNotificationIndex(id)];
		}

		function deleteNotification( id ) {
			console.log('Deleting item: ' + id );
			var notification = getNotification(id);
			notifications.splice(getNotificationIndex( id ), 1);
			var doDelete = true;
			for (var i = 0; i < notifications.length; i++ ) {
				if (notifications[i].fileId == notification.fileId) {
					doDelete = false;
				}
			}
			if(doDelete) {
				files.splice(getFileIndex( notification.fileId ), 1);
			}
			return doDelete;
		}

		function getNotificationIndex(id) {
			var index = -1;
			for (var i = 0; i < notifications.length; i++) {
				if ( notifications[i].id == id) {
					index = i;
				}
			}
			return index;
		}

		function getFileIndex(id) {
			var index = -1;
			for (var i = 0; i < files.length; i++) {
				if ( files[i].id == id) {
					index = i;
				}
			}
			return index;
		}

		function addFile(path, targets) {
			var file = { filename : path, id : fileCounter++};

			files.push( file );

			targets.forEach(function(target){
				var notification = { filename : path, id : notificationCounter++, target : target, fileId: file.id };
				notifications.push(notification);

			});
			console.log('Added: ' + path);
		}
		//------------------------------------
		// Return the newly created "instance"
		//------------------------------------
		return {
			//--------------
			// Notifications
			//--------------
			getNotifications: getNotifications,
			getNotification: getNotification,
			deleteNotification: deleteNotification,
			getNotificationIndex: getNotificationIndex,

			//-----------------------------
			// Files (metadata about files)
			//-----------------------------
			getFileIndex: getFileIndex,
			addFile: addFile
		};
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function() {
        return create();
    };
}());
