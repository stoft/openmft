//---------------------------------------------------------------------------
// Administrator server
// Started by mimosa
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
	function serve(req, res, next) {
	    var fname = path.normalize('./public' + req.path());

	    console.log('GET %s maps to %s', req.path(), fname);

	    res.contentType = mime.lookup(fname);
	    var f = filed(fname);
	    f.pipe(res);
	    f.on('end', function () {
	        return next(false);
	    });

	    return false;
	}

	function serveIndex(req, res, next) {
	    var fname = path.normalize('./views/index.html');

	    console.log('GET %s maps to %s', req.path(), fname);

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
	var startServer = function(mimosaConfig, callback) {
		console.log("Working Directory: " + process.cwd());

		//-------------------------
		// Read agent configuration
		//-------------------------
		var expectedVersion = 0.1;
		var configFile = path.resolve('../../etc/current/config.json');
		console.log("Reading configuration file: " + configFile);
		var config = JSON.parse(fs.readFileSync(configFile));
		if (config.version != expectedVersion) {
			console.log("Mismatch of agent binary and configuration versions: " + expectedVersion + " != " + config.version + ", exiting");
			process.exit(1);
		}

		var server = restify.createServer();
		server.use(restify.queryParser());
		server.use(restify.bodyParser({ mapParams: false }));

		// REST functions
		server.put('/rest/agent/:id', function(req, res, next) {
			console.log("Agent checked in ("+req.params.id+"): " + JSON.stringify(req.body));
			res.send("ok");
		});

		server.get(/\/rest\/?.*/, function(req,res,next){
			console.log("(REST) Not implemented: " + req.href());
			res.send("root");
		});

		// Serve static content
		server.get(/javascripts\/.*/, serve);
		server.get(/font\/.*/, serve);
		server.get(/images\/.*/, serve);
		server.get(/stylesheets\/.*/, serve);
		server.get(/x\/.*/, serve);
		server.get(/test.txt/, serve);

		// Anything else is redirected to SPA (index.html)
		server.get(/.*/, serveIndex);

		// server.get(/.*/, restify.serveStatic({
		//   directory: './public',
		//   default: 'test.txt'
		// }));

		// Start server
		server.listen(config.port, function() {
		  console.log('%s listening at %s', server.name, server.url);
		});

		// Mimosa wants us to invoke the callback
		callback(server);
	}

	//---------------
	// Module exports
	//---------------
    module.exports.startServer = function(mimosaConfig, callback) {
        return startServer(mimosaConfig, callback);
    }
}());