//---------------------------------------------------------------------------
// Administrator backend interface
// (REST operations and serving static client files)
//---------------------------------------------------------------------------
"use strict";

(function() {
	//-------------
	// Dependencies
	//-------------
	var restify = require("restify");
	var path = require("path");
	var filed = require("filed");
	var mime = require("mime");

	//-----------------------------------
	// Internal functions
	//-----------------------------------

	// Serve static web client file
	function serve(req, res, next) {
	    var fname = path.normalize("./public" + req.path());

	    //console.log("GET %s maps to %s", req.path(), fname);

	    res.contentType = mime.lookup(fname);
	    var f = filed(fname);
	    f.pipe(res);
	    f.on("end", function () {
	        return next(false);
	    });

	    return false;
	}

	// Serve static web client index.html
	function serveIndex(req, res, next) {
	    var fname = path.normalize("./views/index.html");

	    // console.log("GET %s maps to %s", req.path(), fname);

	    res.contentType = mime.lookup(fname);
	    var f = filed(fname);
	    f.pipe(res);
	    f.on("end", function () {
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
		server.get("/rest/v1/agents", function(req, res, next) {
			var agents = state.getResources("agent");
			res.send({agents: agents});
			return next();
		});

		// Create agent
		server.post("/rest/v1/agents", function(req, res, next) {
			var agent = state.addResource("agent", req.body);
			res.send({agent: agent});
			return next();
		});

		// Get agent details
		server.get("/rest/v1/agents/:id", function(req, res, next) {
			var agent = state.getResource("agent", req.params.id);
			if (agent) {
				res.send({agent: agent});
				return next();
			}
			else {
				return next(new restify.ResourceNotFoundError("%s does not exist", req.url));
			}
		});

		// Update agent
		server.put("/rest/v1/agents/:id", function(req, res, next) {
			var agent = state.updateResource("agent", req.params.id, req.body);
			res.send({agent: agent});
			return next();
		});

		// Delete agent
		server.del("/rest/v1/agents/:id", function(req, res, next) {
			state.deleteResource("agent", req.params.id);
			res.send("ok");
			return next();
		});

		// List all transfers
		server.get("/rest/v1/transfers", function(req, res, next) {
			var transfers = state.getResources("transfer");
			res.send({transfers: transfers});
			return next();
		});

		// Create transfer
		server.post("/rest/v1/transfers", function(req, res, next) {
			var transfer = state.addResource("transfer", req.body);
			res.send({transfer: transfer});
			return next();
		});

		// Get transfer details
		server.get("/rest/v1/transfers/:id", function(req, res, next) {
			var transfer = state.getResource("transfer", req.params.id);
			if (transfer) {
				res.send({transfer: transfer});
				return next();
			}
			else {
				return next(new restify.ResourceNotFoundError("%s does not exist", req.url));
			}
		});

		// Update transfer
		server.put("/rest/v1/transfers/:id", function(req, res, next) {
			var transfer = state.updateResource("transfer", req.params.id, req.body);
			res.send({transfer: transfer});
			return next();
		});

		// Delete transfer
		server.del("/rest/v1/transfers/:id", function(req, res, next) {
			state.deleteResource("transfer", req.params.id);
			res.send("ok");
			return next();
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
		  console.log("%s listening at %s", server.name, server.url);
		});

		return server;
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(config, agents) {
        return create(config, agents);
    };
}());