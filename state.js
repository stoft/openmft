(function() {

	var create = function() {
		var fileQueue = [];
		var notifications = [];
		var files = [];
		var fileCounter = 0;
		var notificationCounter = 0;

		var moduleObject = {

			getNotifications: function(target) {
				var results = [];
				for(var i = 0; i < notifications.length; i++) {
					if(notifications[i].target == target) {
						results.push(notifications[i]);
					}
				}
				return results;
			},

			getNotification: function(id) {
				return notifications[this.getNotificationIndex(id)];
			},

			deleteNotification: function( id ) {
				console.log("Deleting item: " + id );
				var notification = this.getNotification(id);
				notifications.splice(this.getNotificationIndex( id ), 1);
				var doDelete = true;
				for(var i = 0; i < notifications.length; i++ ) {
					if(notifications[i].fileId == notification.fileId)
						doDelete = false;
				}
				if(doDelete) {
					files.splice(this.getFileIndex( notification.fileId ), 1);
				}
				return doDelete;
			},

			getFileIndex: function(id) {
				var index = -1;
				for (var i = 0; i < files.length; i++) {
					if ( files[i].id == id) {
						index = i;
					}
				}
				return index;
			},

			getNotificationIndex: function(id) {
				var index = -1;
				for (var i = 0; i < notifications.length; i++) {
					if ( notifications[i].id == id) {
						index = i;
					}
				}
				return index;
			},


			addFile: function(path, targets) {
				var file = { filename : path, id : fileCounter++};

				files.push( file );

				targets.forEach(function(target){
					var notification = { filename : path, id : notificationCounter++, target : target, fileId: file.id };
					notifications.push(notification);

				});
				console.log("Added: " + path);
			}
			
		};

		return moduleObject;
	}

    module.exports.create = function() {
        return create();
    }
}());
