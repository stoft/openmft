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
		//------------------------
		// Administrator Interface
		//------------------------

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