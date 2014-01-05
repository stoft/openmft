//---------------------------------------------------------------------------
// REST Interface Mock Services
// Provides a simple mock interface to test MFT agents against.
//---------------------------------------------------------------------------

//-------------
// Dependencies
//-------------
var restify = require('restify');
var restApi = require('../src/restapi.js');


//------------------------------
// Initialize the REST interface
//------------------------------
var server = restify.createServer();
server.use(restify.queryParser());

var notifications = [
	{
		id : 1,
		version : 1,
		source : 1,
		target : 2,
		transfer : 1,
		fileId : 1,
		filename : "/foo/bar/baz.txt"
	},
	{
		id : 2,
		version : 1,
		source : 1,
		target : 2,
		transfer : 2,
		fileId : 2,
		filename : "/foo/bar/grill.txt"
	}];

//------------------------
// File Transfer Interface
//------------------------
server.get('/rest/v1/notifications/', function(req,res,next) {
	if(req.query.target){
		res.send(notifications);
	}
	else {
		res.send(403);
	}
});

server.get('/rest/v1/notifications/:id', function(req,res,next){
	res.send(notifications[req.params.id - 1]);
});

server.get('/rest/v1/files/:id', function(req,res,next){
	var file = "A test text file with content.";
	res.send(file);
});

server.del('/rest/v1/notifications/:id', function(req,res,next){
	if(req.params.id <= notifications.length + 1 ) {
		res.send("ok");
	}
	else {
		res.send(404);
	}
});
//------------------------
// Administrator Interface
//------------------------

// Retrieve agent status
server.get('/rest/v1/agents/:id', function(req,res,next){
	res.send({
		agent : {
			version : 1,
			name : "x",
			id : 1,
			host : "localhost",
			port : 3301,
			version : 1,
			inboundDir : "/foo/bar/baz",
			outboundDir : "foo/bar/baz",
			state : "RUNNING"
		}
	}); 
});

// Pause or start agent
server.post('/rest/v1/agents/:id', function(req,res,next){
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
server.get('/rest/v1/transfer/:id', function(req,res,next){
	res.send("Not implemented"); 
});

// Update transfer status (pause or resume)
server.post('/rest/v1/transfer/:id', function(req,res,next){
	res.send("Not implemented"); 
});

//-------------------------
// Start the REST interface
//-------------------------
server.listen(3301, function() {
  console.log('%s listening at %s', server.name, server.url);
});
