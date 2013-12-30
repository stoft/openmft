//---------------------------------------------------------------------------
// Client
// Provides the client functionality between the agent process
// and the the rest of the OpenMFT network
// The client will actively call other MFT agents.
//---------------------------------------------------------------------------
(function() {
	//-------------
	// Dependencies
	//-------------


	//------------
	// Constructor
	//------------	
	var create = function(state, config) {

		//-----------------------
		// Hidden state variables
		//-----------------------
		var subscriptions = [];


		//-----------------------
		// Functions
		//-----------------------
		var addSubscription = function(hostname, port){
			return "Not implemented.";
		};

		var removeSubscription = function(hostname, port){
			return "Not implemented.";
		};





	//---------------
	// Module exports
	//---------------
    module.exports.create = function(state, config) {
        return create(state, config);
    }
}());