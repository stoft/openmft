(function() {
	var chokidar = require('chokidar');
	/*
	var counter = 0;

	function getFile(req, res, next) {
		var file = getQueueItem(req.params.id);
		fs.createReadStream(file.filename).pipe(res);

		//res.send(JSON.stringify(file));
	}
	*/
	
	var create = function(state) {
		var watcher = chokidar.watch('/var/tmp/openmft', {ignored: /[\/\\]\./});
		watcher
			.on('add', state.addFileToQueue );
	};

    module.exports.create = function(state) {
        return create(state);
    }
}());

