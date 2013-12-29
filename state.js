(function() {

	var create = function() {
		var fileQueue = [];
		var counter = 0;
		var moduleObject = {

			getQueue: function() {
				return fileQueue;
			},

			getQueueItem: function( id ) {
				console.log(id);
				return fileQueue[ id ];
			},

			deleteQueueItem: function( id ) {
				console.log("Deleting item: " + id );
				fileQueue.splice(this.getQueueItemIndex( id ), 1);
			},

			getQueueItemIndex: function(id) {
				var index = -1;
				for (var i = 0; i < fileQueue.length; i++) {
					if ( fileQueue[i].id == id) {
						index = i;
					}
				}
				return index;
			},

			getQueueItem: function(id) {
				return fileQueue[this.getQueueItemIndex(id)];
			},

			addFileToQueue: function(path) {
				fileQueue.push( { filename : path, id : counter++ });
				console.log("Added: " + path);
			}
			
		};

		return moduleObject;
	}

    module.exports.create = function() {
        return create();
    }
}());
