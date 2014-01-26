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
	var restApi = require('./restapi.js');
	var uuid = require('node-uuid');
	// var fs = require('fs');

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
			console.log(err);
			return next(err);
		}
	}

	//------------
	// Constructor
	//------------	
	var create = function(config, agentState, adminState, fileInterface) {
		//------------------------------
		// Initialize the REST interface
		//------------------------------
		var server = restify.createServer();
		server.use(restify.queryParser());
		server.use(restify.bodyParser({ mapParams: false }));
		
		//------------------------
		// File Transfer Interface
		//------------------------

		// Get notifications
		server.get('/rest/v1/notifications', function(req, res, next){
			console.log('GET ' + req.path());
			if(req.query.target) {
				agentState.notification.findResources(function matchTarget(notification) {
					return req.query.target == notification.target;
				}, function(err, result) {
					sendRestResponse(req, res, next, err, result, 'notifications');
				});
			}
			// TODO debug interface, should be removed or switchable using
			// debug flag in configuration file.
			else if( req.query.debug) {
				agentState.notification.findResources( null , function(err, result) {
					sendRestResponse(req, res, next, err, result, 'notifications');
				});
			}
			else {
				res.send(403);
			}
		});

		// Get notification
		server.get('/rest/v1/notifications/:id', function(req, res, next){
			console.log('GET ' + req.path());
			agentState.notification.getResource(req.params.id, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'notification');
			});
		});

		// Push notification
		server.post('/rest/v1/notifications', function(req, res, next){
			console.log('POST ' + req.path());
			// Ignore duplicates
			try {
				agentState.notification.addResource(req.body, function(err, result) {
					sendRestResponse(req, res, next, err, result, 'notification');
				});
			}
			catch (e) {
				// Return existing notification if already exist
				agentState.notification.getResource(req.params.id, function(err, result) {
					sendRestResponse(req, res, next, err, result, 'notification');
				});
			}
		});

		// Delete notification
		server.del('/rest/v1/notifications/:id', function(req, res, next){
			console.log('DELETE ' + req.path());
			agentState.notification.deleteResource(req.params.id, function(err) {
				sendRestResponse(req, res, next, err, 'ok');
			});
		});

		// Get file
		server.get('/rest/v1/files/:id', function(req, res, next){
			console.log('GET ' + req.path());
			if (req.query.agentId) {
				var uploadId = uuid.v4();
				agentState.file.getResource(req.params.id, function(err, file) {
					if (! err) {
						agentState.upload.addResource({ id : uploadId }, function addUpload() {
							agentState.upload.getResource(uploadId, function(err, result) {
								if(!err) {
									// console.log('Uploading file: ', JSON.stringify(file));
									fileInterface.getFileReadStream(file.path).pipe(res);
									res.on('finish', function onFinish() {
										agentState.upload.updateResource( uploadId, result);
									});
								} else {
									console.log('Could not find upload resource.');
									//TODO error handling
								}
							});
						});
					}
					else {
						next(err);
					}
				});
			} else {
				console.log('File request missing agentId!');
				//TODO error handling
			}
		});

		// Download file from remote agent.
		function downloadFile(host, port, notification, transfer, callback) {
			var index = notification.filename.lastIndexOf('/');
			var filename = notification.filename.substring(index + 1);
			var client = restify.createClient({ url : 'http://' + host + ':' + port });
			client.get(restApi.FILES + '/' + notification.fileId + '?agentId=' + config.id, function(err, req) {
				if(err) {
					console.log('Downloading file. Error performing request: ' + JSON.stringify(err));
					throw err;
				}

				req.on('result', function(err, res) {
					if(err) {
						console.log('Downloading file. Error reading response: ' + JSON.stringify(err));
						throw err;
					}
					else {
						var writableStream = fileInterface.pushToFile(res, filename, transfer);
						// res.pipe(file);
						writableStream
						.on('finish', function() {
							agentState.notification.deleteResource(notification.id);
							callback(host, port, notification);
								// Log an event that we successfully transferred a file
								agentState.event.addResource({
									time: new Date(),
									type: 'FileTransferred',
									agent: config.id,
									transfer: transfer.id,
									file: notification.fileId
								});
							});
					}
				});
			});
		}

		//------------------------
		// Administrator Interface
		//------------------------

		// Get transfers
		server.get('/rest/v1/transfers', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.transfer.findResources(null, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfers');
			});
		});

		// Create transfer
		server.post('/rest/v1/transfers', function(req, res, next){
			console.log('POST ' + req.path() + ' ' + JSON.stringify(req.body));
			adminState.transfer.addResource(req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfer');
			});
		});

		// Get transfer
		server.get('/rest/v1/transfers/:id', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.transfer.getResource(req.params.id, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfer');
			});
		});

		// Update transfer
		server.put('/rest/v1/transfers/:id', function(req, res, next){
			console.log('PUT ' + req.path());
			adminState.transfer.updateResource(req.params.id, req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'transfer');
			});
		});

		// Delete transfer
		server.del('/rest/v1/transfers/:id', function(req, res, next){
			console.log('DELETE ' + req.path());
			adminState.transfer.deleteResource(req.params.id, function(err) {
				sendRestResponse(req, res, next, err, 'ok');
			});
		});

		// Get agents
		server.get('/rest/v1/agents', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.agent.findResources(null, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agents');
			});
		});

		// Create agent
		server.post('/rest/v1/agents', function(req, res, next){
			console.log('POST ' + req.path());
			adminState.agent.addResource(req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agent');
			});
		});

		// Get agent
		server.get('/rest/v1/agents/:id', function(req, res, next){
			console.log('GET ' + req.path());
			adminState.agent.getResource(req.params.id, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agent');
			});
		});

		// Update agent
		server.put('/rest/v1/agents/:id', function(req, res, next){
			console.log('PUT ' + req.path());
			adminState.agent.updateResource(req.params.id, req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, 'agent');
			});
		});

		// Delete agent
		server.del('/rest/v1/agents/:id', function(req, res, next){
			console.log('DELETE ' + req.path());
			adminState.agent.deleteResource(req.params.id, function(err) {
				sendRestResponse(req, res, next, err, 'ok');
			});
		});

		//-------------------------
		// Start the REST interface
		//-------------------------
		server.listen(config.port, function() {
			console.log('Agent listening at %s', server.url);
		});

		//------------------------------------
		// Return the newly created 'instance'
		//------------------------------------
		return {
			downloadFile: downloadFile
		};
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(config, agentState, adminState, fileInterface) {
		return create(config, agentState, adminState, fileInterface);
	};
}());