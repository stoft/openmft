//---------------------------------------------------------------------------
// REST Interface
// Provides the interfaces between the agent process
// and the the rest of the OpenMFT network
//---------------------------------------------------------------------------
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
		//------------------------------
		// Initialize the REST interface
		//------------------------------
		var server = restify.createServer();
		server.use(restify.queryParser());
		
		//------------------------
		// File Transfer Interface
		//------------------------
		server.get('/rest/v1/notifications/', function(req,res,next) {
			if(req.query.target){
				res.send(state.getNotifications(req.query.target));
			}
			else {
				res.send(403);
			}
		});
		
		server.get('/rest/v1/notifications/:id', function(req,res,next){
			res.send(state.getNotification(req.params.id));
		});
		
		server.get('/rest/v1/files/:id', function(req,res,next){
			var file = state.getNotification(req.params.id);
			fs.createReadStream(file.filename).pipe(res);
		});

		server.del('/rest/v1/notifications/:id', function(req,res,next){
			var queueItem = state.getNotification(req.params.id);
			if(state.deleteNotification(req.params.id)) {
				fs.unlink(queueItem.filename, function(){
					res.send("ok");
				});
			}
			else {
				res.send(404);
			}
		});
		//------------------------
		// Administrator Interface
		//------------------------

		// Retrieve agent status
		server.get('/status', function(req,res,next){
			res.send({
				id : config.id,
				version : config.version,
				state : "RUNNING"
			}); 
		});
		
		// Pause or start agent
		server.post('/status', function(req,res,next){
			res.send("Not implemented"); 
		});

		// Get agent configuration
		server.get('/configuration', function(req,res,next){
			res.send("Not implemented"); 
		});

		// Update agent configuration
		server.post('/configuration', function(req,res,next){
			res.send("Not implemented"); 
		});

		// Get transfers (and status of the same)
		server.get('/transfer', function(req,res,next){
			res.send("Not implemented"); 
		});

		// Update transfer status (pause or resume)
		server.post('/transfer/:id', function(req,res,next){
			res.send("Not implemented"); 
		});

		//-------------------------
		// Start the REST interface
		//-------------------------
		server.listen(config.port, function() {
		  console.log('%s listening at %s', server.name, server.url);
		});

		//------------------------------------
		// Return the newly created "instance"
		//------------------------------------
		return {};
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());