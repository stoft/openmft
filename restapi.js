var restify = require('restify');

var bar = { filename : "bar.txt" };
var baz = {filename : "baz.txt"};

var fileevents = [bar, baz];

function respond_fileevent( req, res, next) {
	console.log(req.params.id);
	res.send(JSON.stringify(fileevents[req.params.id]));
	//console.log(res);
}

var server = restify.createServer();
server.get('/fileevent/:id', respond_fileevent);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});