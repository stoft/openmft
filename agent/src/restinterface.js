//---------------------------------------------------------------------------
// REST Interface
// Provides the interfaces between the agent process
// and the the rest of the OpenMFT network
//---------------------------------------------------------------------------
(function() {
	'use strict';
	//-------------
	// Dependencies
	//-------------
	var restify = require('restify');
	var fs = require('fs');

	//-----------------------------------
	// Internal functions
	//-----------------------------------

	function sendRestResponse(req, res, next, err, response, wrapperName) {
		if (! err) {
			var r = response;
			// For methods that return a resource, wrap with singular/plural name of resource type
			if (wrapperName) {
				r = {};
				r[wrapperName] = response;
			}
			res.send(r);
			return next();
		}
		else {
			return next(err);
		}
	}

	//------------
	// Constructor
	//------------	
	var create = function(state, adminState, port) {
		//------------------------------
		// Initialize the REST interface
		//------------------------------
		var server = restify.createServer();
		server.use(restify.queryParser());
		
		//------------------------
		// File Transfer Interface
		//------------------------
		server.get('/rest/v1/notifications/', function(req, res) {
			if(req.query.target){
				res.send(state.getNotifications(req.query.target));
			}
			else {
				res.send(403);
			}
		});
		
		server.get('/rest/v1/notifications/:id', function(req, res){
			res.send(state.getNotification(req.params.id));
		});
		
		server.get('/rest/v1/files/:id', function(req, res){
			var file = state.getNotification(req.params.id);
			fs.createReadStream(file.filename).pipe(res);
		});

		server.del('/rest/v1/notifications/:id', function(req, res){
			var queueItem = state.getNotification(req.params.id);
			if(state.deleteNotification(req.params.id)) {
				fs.unlink(queueItem.filename, function(){
					res.send('ok');
				});
			}
			else {
				res.send(404);
			}
		});
		//------------------------
		// Administrator Interface
		//------------------------

		// Get transfers
		server.get('/rest/v1/transfers', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.findResources('transfer', null, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfers');
			});
		});

		// Create transfer
		server.post('/rest/v1/transfers', function(req, res, next){
			console.log('POST ' + req.path());
			adminState.addResource('transfer', req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfer');
			});
		});

		// Get transfer
		server.get('/rest/v1/transfers/:id', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.getResource('transfer', req.params.id, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfer');
			});
		});

		// Update transfer
		server.put('/rest/v1/transfers/:id', function(req, res, next){
			console.log('PUT ' + req.path());
			adminState.updateResource('transfer', req.params.id, req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfer');
			});
		});

		// Delete transfer
		server.del('/rest/v1/transfers/:id', function(req, res, next){
			console.log('DELETE ' + req.path());
			adminState.deleteResource('transfer', req.params.id, function(err) {
				sendRestResponse(req, res, next, err, 'ok');
			});
		});

		// Get agents
		server.get('/rest/v1/agents', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.findResources('agent', null, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agents');
			});
		});

		// Create agent
		server.post('/rest/v1/agents', function(req, res, next){
			console.log('POST ' + req.path());
			adminState.addResource('agent', req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agent');
			});
		});

		// Get agent
		server.get('/rest/v1/agents/:id', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.getResource('agent', req.params.id, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agent');
			});
		});

		// Update agent
		server.put('/rest/v1/agents/:id', function(req, res, next){
			console.log('PUT ' + req.path());
			adminState.updateResource('agent', req.params.id, req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agent');
			});
		});

		// Delete agent
		server.del('/rest/v1/agents/:id', function(req, res, next){
			console.log('DELETE ' + req.path());
			adminState.deleteResource('agent', req.params.id, function(err) {
				sendRestResponse(req, res, next, err, 'ok');
			});
		});

		//-------------------------
		// Start the REST interface
		//-------------------------
		server.listen(port, function() {
		  console.log('Agent listening at %s', server.url);
		});

		//------------------------------------
		// Return the newly created 'instance'
		//------------------------------------
		return {};
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, adminState, port) {
        return create(state, adminState, port);
    };
}());