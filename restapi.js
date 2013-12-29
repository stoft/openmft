(function() {

var server = restify.createServer();
server.get('/fileevent/', getQueue);
server.get('/fileevent/:id', getQueueItem);
server.get('/file/:id', getFile);
server.del('/fileevent/:id', deleteQueueItem);



server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

    module.exports.create = function(config) {
        return create(config);
    }
}());