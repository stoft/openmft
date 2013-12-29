(function() {
	var chokidar = require('chokidar');
	/*
	var counter = 0;

	function getFile(req, res, next) {
		var file = getNotification(req.params.id);
		fs.createReadStream(file.filename).pipe(res);

		//res.send(JSON.stringify(file));
	}
	*/
	
	var create = function(state, config) {
		config.triggers.forEach(function(trigger){
			console.log("Monitoring: " + trigger.dir);
			var watcher = chokidar.watch(trigger.dir, {ignored: /[\/\\]\./});
			watcher
				.on('add', function(path, event){
					state.addFile(path, trigger.targets);
				});
		});
	};

    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());

