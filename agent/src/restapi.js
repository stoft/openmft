'use strict';

(function() {

	//---------------
	// Internals
	//---------------
	var version = 'v1';

	//---------------
	// Module exports
	//---------------
    module.exports = {
		FILES: '/rest/' + version + '/files',
		NOTIFICATIONS : '/rest/' + version + '/notifications',
		TRANSFERS: '/rest/' + version + '/transfers',
		AGENTS: '/rest/' + version + '/agents'
	};
}());