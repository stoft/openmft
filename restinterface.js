(function() {
	var restify = require('restify');
	var fs = require('fs');

	var create = function(state, config) {

		var server = restify.createServer();
		server.use(restify.queryParser());
		
		server.get('/notification/', function(req,res,next) {
			if(req.query.target){
				res.send(JSON.stringify( state.getNotifications(req.query.target) ) );
			}
			else {
				res.send(403);
			}
		});
		
		server.get('/notification/:id', function(req,res,next){
			res.send(JSON.stringify( state.getNotification(req.params.id))); 
		});
		
		server.get('/file/:id', function(req,res,next){
			var file = state.getNotification(req.params.id);
			fs.createReadStream(file.filename).pipe(res);
		});

		server.del('/notification/:id', function(req,res,next){
			var queueItem = state.getNotification(req.params.id);
			if(state.deleteNotification(req.params.id)) {
				fs.unlink(queueItem.filename, function(){
					res.send("ok");
				});
			}
			else {
				res.send("ok");
			}
		});

		server.listen(config.port, function() {
		  console.log('%s listening at %s', server.name, server.url);
		});

	};

    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());