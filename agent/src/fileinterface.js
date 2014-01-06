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
	var create = function(state, config, adminState) {
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

		onStart();

		//------------
		// Subscribe to adminState events
		//------------

		adminState.on('add', function onAdd(resource) {
			console.log('onAdd: ' + resource.resourceType);
			if (resource.resourceType === 'transfer') {
				transferCreated(resource.transfer);
			}
		});
		adminState.on('update', function onUpdate(resource, old) {
			if (resource.resourceType === 'transfer') {
				transferUpdated(resource.transfer, old);
			}
		});
		adminState.on('delete', function onDelete(resource, old) {
			if (resource.resourceType === 'transfer') {
				transferDeleted(old);
			}
		});

		//------------
		//Internals
		//------------

		function onStart() {
			adminState.findResources( 'transfer', null , function load(err, transfers) {
				if (err) {
					console.log('client.onStart error: ' + JSON.stringify(err));
				}
				else {
					_.each(transfers, loadTransfer);
				}
			});
		}

		function loadTransfer(transfer) {
			if (_.some(transfer.sources, function us(source) {
				return source.agentId === config.id;
			})) {
				console.log('fileinterface.loadTransfer found source');
				var dir = config.inboundDir + '/' + transfer.name;
				if ( !fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}
				console.log("Monitoring: " + dir);
				var watcher = chokidar.watch(dir, {ignored: /[\/\\]\./});
				watcher
				.on('add', function(path, event){
					var targetIds = _.map(transfer.targets, function getTargetId(target){
						return target.agentId;
					});
					console.log('Found new file: %s', path);
					state.addFile(path, targetIds, transfer);
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
		return {};
	};

	//---------------
	// Module exports
	//---------------
	module.exports.create = function(state, config, adminState) {
		return create(state, config, adminState);
	};
}());

