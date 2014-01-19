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

	    res.contentType = mime.lookup(fname);
	    var f = filed(fname);
	    f.pipe(res);
	    f.on("end", function () {
	        return next(false);
	    });

	    return false;
	}

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

	// Remove trailing s on resource type name
	function singular(s) {
		return s.substring(0, s.length-1);
	}

	//-----------------------------------
	// Initialize and start agent process
	//-----------------------------------
	var create = function(config, adminState, agentState) {
		// Initialize server
		var server = restify.createServer();
		server.use(restify.queryParser());
		server.use(restify.bodyParser({ mapParams: false }));

		var resourceSets = {
			agent: adminState.agent,
			transfer: adminState.transfer,
			event: agentState.event
		};

		// List all resources
		server.get("/rest/v1/:type", function(req, res, next) {
			console.log("GET " + req.path());
			resourceSets[singular(req.params.type)].findResources(null, function(err, result) {
				sendRestResponse(req, res, next, err, result, req.params.type);
			});
		});

		// Create resource
		server.post("/rest/v1/:type", function(req, res, next) {
			console.log("POST " + req.path());
			resourceSets[singular(req.params.type)].addResource(req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, singular(req.params.type));
			});
		});

		// Get resource details
		server.get("/rest/v1/:type/:id", function(req, res, next) {
			console.log("GET " + req.path());
			resourceSets[singular(req.params.type)].getResource(req.params.id, function(err, result) {
				sendRestResponse(req, res, next, err, result, singular(req.params.type));
			});
		});

		// Update resource
		server.put("/rest/v1/:type/:id", function(req, res, next) {
			console.log("PUT " + req.path());
			resourceSets[singular(req.params.type)].updateResource(req.params.id, req.body, function(err, result) {
				sendRestResponse(req, res, next, err, result, singular(req.params.type));
			});
		});

		// Delete resource
		server.del("/rest/v1/:type/:id", function(req, res, next) {
			console.log("DELETE " + req.path());
			resourceSets[singular(req.params.type)].deleteResource(req.params.id, function(err) {
				sendRestResponse(req, res, next, err, "ok");
			});
		});

		//---------------------
		// Serve static content
		//---------------------
		server.get(/javascripts\/.*/, serve);
		server.get(/fonts?\/.*/, serve);
		server.get(/images\/.*/, serve);
		server.get(/stylesheets\/.*/, serve);
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
    module.exports.create = function(config, adminState, agentState) {
        return create(config, adminState, agentState);
    };
}());