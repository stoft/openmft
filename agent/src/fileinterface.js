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
	var path = require('path');

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

		function getFileReadStream(filePath) {
			console.log('Getting file read stream: ', filePath);
			var rs;
			try {
				rs = fs.createReadStream(filePath);
			} catch (err) {
				console.log('Getting file read stream. Encountered error: ', JSON.stringify(err) );
				throw err;
			}
			// rs.on('error', function(err) {
			// });
			return rs;
		}

		function moveFile(oldPath, newPath){
			console.log('Moving file %s to %s.', oldPath, newPath );
			if ( !fs.existsSync(path.dirname(newPath)) ) {
				fs.mkdirSync(path.dirname(newPath));
			}
			fs.rename(oldPath, newPath, function(err){
				if (err) {
					console.log('Error moving file %s to %s.', oldPath, newPath );
				}
			});
		}

		function pushToFile(readableStream, filename, transfer) {
			var tmpFolder = (config.runtimeDir.charAt(
				config.runtimeDir.length - 1) === '/') ?
					config.runtimeDir :
					config.runtimeDir + '/';
			var finalFolder = (config.outboundDir.charAt(
				config.outboundDir.length - 1) === '/') ?
					config.outboundDir :
					config.outboundDir + '/';
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
				console.log('Monitoring: ' + dir);
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
		function transferUpdated(transfer) {
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

