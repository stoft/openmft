var should = require('should');

var client = require('../src/client.js');




describe('client', function() {
	var agentState = {
		file : null,
		event : {
			addResource: function addResource(resource) {

			},
			deleteResource: function deleteResource(resource) {
				
			}
		},
		notification : {
			addResource : function addResource(resource) {

			},
			findResource : function findResources(resource) {

			}
		}
	};

	var ri = {

	};

	var fi = require('../src/fileinterface.js');
	var config = {
		id : 1,
		adminHost : '127.0.0.1',
		adminPort : 3300
	};
	var client = require('../src/client.js');
	// var client = cli.create(config, null, null, null, null)


	describe('#subscribe()', function() {
		it('should return 0 when the subscription succeeds', function() {
			client.create.subscribe(1, '127.0.0.1', 3301, null).should.equal(0);

			// [1,2,3].indexOf(5).should.equal(-1);
			// [1,2,3].indexOf(0).should.equal(-1);
		})
	})
});
