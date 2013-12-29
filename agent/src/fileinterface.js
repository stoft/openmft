//---------------------------------------------------------------------------
// File Interface
// Provides the interface between the agent process and the hosts file system
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------
	var chokidar = require('chokidar');

	//------------
	// Constructor
	//------------	
	var create = function(state, config) {
		//-----------------------------------------------
		// Initialize and start the file system interface
		//-----------------------------------------------
		config.triggers.forEach(function(trigger){
			console.log("Monitoring: " + trigger.dir);
			var watcher = chokidar.watch(trigger.dir, {ignored: /[\/\\]\./});
			watcher
				.on('add', function(path, event){
					state.addFile(path, trigger.targets);
				});
		});

		//------------------------------------
		// Return the newly created "instance"
		//------------------------------------
		return {};
	};

	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());

