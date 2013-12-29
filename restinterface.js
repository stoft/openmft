(function() {
	var restify = require('restify');
	var fs = require('fs');

	var create = function(state, config) {

		var server = restify.createServer();
		
		server.get('/fileevent/', function(req,res,next){
			res.send(JSON.stringify( state.getQueue() ) );
		});
		
		server.get('/fileevent/:id', function(req,res,next){
			res.send(JSON.stringify( state.getQueueItem(req.params.id))); 
		});
		
		server.get('/file/:id', function(req,res,next){
			var file = state.getQueueItem(req.params.id);
			fs.createReadStream(file.filename).pipe(res);
		});

		server.del('/fileevent/:id', function(req,res,next){
			var queueItem = state.getQueueItem(req.params.id);
			state.deleteQueueItem(req.params.id);
			fs.unlink(queueItem.filename, function(){
				res.send("ok");
			});
		});

		server.listen(config.port, function() {
		  console.log('%s listening at %s', server.name, server.url);
		});

	};

    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());