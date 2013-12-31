//---------------------------------------------------------------------------
// Administrator backend interface
// (REST operations and serving static client files)
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var restify = require('restify');
	var path = require('path');
	var filed = require('filed');
	var fs = require('fs');
	var mime = require('mime');

	//-----------------------------------
	// Internal functions
	//-----------------------------------

	// Serve static web client file
	function serve(req, res, next) {
	    var fname = path.normalize('./public' + req.path());

	    //console.log('GET %s maps to %s', req.path(), fname);

	    res.contentType = mime.lookup(fname);
	    var f = filed(fname);
	    f.pipe(res);
	    f.on('end', function () {
	        return next(false);
	    });

	    return false;
	}

	// Serve static web client index.html
	function serveIndex(req, res, next) {
	    var fname = path.normalize('./views/index.html');

	    // console.log('GET %s maps to %s', req.path(), fname);

	    res.contentType = mime.lookup(fname);
	    var f = filed(fname);
	    f.pipe(res);
	    f.on('end', function () {
	        return next(false);
	    });

	    return false;
	}

	//-----------------------------------
	// Initialize and start agent process
	//-----------------------------------
	var create = function(config, state) {
		// Initialize server
		var server = restify.createServer();
		server.use(restify.queryParser());
		server.use(restify.bodyParser({ mapParams: false }));

		// List all agents
		server.get('/rest/v1/agents', function(req, res, next) {
			res.send(state.getResources("agent"));
		});

		// Create agent
		server.post('/rest/v1/agents', function(req, res, next) {
			var agent = state.addResource("agent", req.body);
			res.send({agent: agent});
		});

		// Get agent details
		server.get('/rest/v1/agents/:id', function(req, res, next) {
			res.send(state.getResource("agent", req.params.id));
		});

		// Update agent
		server.post('/rest/v1/agents/:id', function(req, res, next) {
			// console.log("Agent checked in ("+req.params.id+"): " + JSON.stringify(req.body));
			// // Update agents array/file
			// var newAgents = [];
			// for (var i = 0; i < agents.length; i++) {
			// 	if (agents[i].id != req.body.id)
			// 		newAgents.push(agents[i]);
			// }
			// newAgents.push(req.body);
			// agents = newAgents;
			// console.log("Writing agent config to: " + agentsFile);
			// fs.writeFile(agentsFile, JSON.stringify(agents));
			res.send("Not implemented yet");
		});

		// Delete agent
		server.del('/rest/v1/agents/:id', function(req, res, next) {
			res.send("Not implemented yet");
		});

		// List all transfers
		server.get('/rest/v1/transfer', function(req, res, next) {
			res.send(state.getResources("transfer"));
		});

		// Create transfer
		server.put('/rest/v1/transfer/:id', function(req, res, next) {
			res.send("Not implemented yet");
		});

		// Get transfer details
		server.get('/rest/v1/transfer/:id', function(req, res, next) {
			res.send(state.getResource("transfer", req.params.id));
		});

		// Update transfer
		server.post('/rest/v1/transfer/:id', function(req, res, next) {
			res.send("Not implemented yet");
		});

		// Delete transfer
		server.del('/rest/v1/transfer/:id', function(req, res, next) {
			res.send("Not implemented yet");
		});

		//---------------------
		// Serve static content
		//---------------------
		server.get(/javascripts\/.*/, serve);
		server.get(/font\/.*/, serve);
		server.get(/images\/.*/, serve);
		server.get(/stylesheets\/.*/, serve);
		server.get(/x\/.*/, serve);
		server.get(/test.txt/, serve);
		// Anything else is redirected to SPA (index.html)
		server.get(/.*/, serveIndex);

		//-------------
		// Start server
		//-------------
		server.listen(config.port, function() {
		  console.log('%s listening at %s', server.name, server.url);
		});

		return server;
	}

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(config, agents) {
        return create(config, agents);
    }
}());