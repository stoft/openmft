'use strict';
//---------------------------------------------------------------------------
// File Interface
// Provides the interface between the agent process and the hosts file system
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var chokidar = require('chokidar');
	var _ = require('underscore');
	var fs = require('fs');

	//------------
	// Constructor
	//------------	
	var create = function(config, agentState, adminState) {
		//-----------------------------------------------
		// Initialize and start the file system interface
		//-----------------------------------------------
		// config.triggers.forEach(function(trigger){
		// 	console.log("Monitoring: " + trigger.dir);
		// 	var watcher = chokidar.watch(trigger.dir, {ignored: /[\/\\]\./});
		// 	watcher
		// 		.on('add', function(path, event){
		// 			state.addFile(path, trigger.targets);
		// 		});
		// });

		var watchers = [];

		//------------
		// Subscribe to adminState events
		//------------

		adminState.transfer.on('add', function onAdd(resource) {
			transferCreated(resource.transfer);
		});
		adminState.transfer.on('update', function onUpdate(resource, old) {
			transferUpdated(resource.transfer, old);
		});
		adminState.transfer.on('delete', function onDelete(resource, old) {
			transferDeleted(old);
		});

		//------------
		// Externals
		//------------

		function start() {
			adminState.transfer.findResources(null , function load(err, transfers) {
				if (err) {
					console.log('client.onStart error: ' + JSON.stringify(err));
				}
				else {
					_.each(transfers, loadTransfer);
				}
			});
		}

		function getFileReadStream(file) {
			return fs.createReadStream(file.path).pipe(res);
		}

		function pushToFile(readableStream, filename, transfer) {
			var tmpFolder = (configuration.runtimeDir.charAt(
				configuration.runtimeDir.length - 1) === '/') ?
					configuration.runtimeDir :
					configuration.runtimeDir + '/';
			var finalFolder = (configuration.outboundDir.charAt(
				configuration.outboundDir.length - 1) === '/') ?
					configuration.outboundDir :
					configuration.outboundDir + '/';
			finalFolder += transfer.name + '/';
			var file = fs.createWriteStream(tmpFolder + filename);
			console.log('Created file readableStream: ' + tmpFolder + filename);
			readableStream.pipe(file);
			file
				.on('finish', function() {
					file.close();
				})
				// TODO may need to be replaced with an event update to hook
				//  in post processing through agentState.
				.on('finish', function() {
					moveFile(tmpFolder + filename, finalFolder + filename);
				});
			return file;
		}

		//------------
		//Internals
		//------------

		function loadTransfer(transfer) {
			var isSource = _.some(transfer.sources, function us(source) {
				return source.agentId === config.id;
			});
			if (isSource) {
				console.log('fileinterface.loadTransfer found source');
				var dir = config.inboundDir + '/' + transfer.name;
				if ( !fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}
				console.log("Monitoring: " + dir);
				var watcher = chokidar.watch(dir, {ignored: /[\/\\]\./, interval: 5});
				watcher.on('add', function(path, event){
					console.log('Found new file: %s', path);
					agentState.file.addResource({path: path, transferId: transfer.id});
				});
			}
		}

		function transferCreated(transfer) {
			console.log('transferCreated: ' + transfer.id + ' we are ' + config.id);
			loadTransfer(transfer);
		}
		function transferUpdated(transfer, old) {
			console.log('transferUpdated: ' + transfer.id);
		}
		function transferDeleted(transfer) {
			console.log('transferDeleted: ' + transfer.id);
		}

		//------------------------------------
		// Return the newly created "instance"
		//------------------------------------
		return {
			start : start,
			getFileReadStream : getFileReadStream,
			pushToFile : pushToFile
		};
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(config, agentState, adminState) {
		return create(config, agentState, adminState);
	};
}());

