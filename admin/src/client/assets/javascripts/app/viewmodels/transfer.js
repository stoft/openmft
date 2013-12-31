define(['plugins/http', 'durandal/app', 'knockout'], function (http, app, ko) {

    return {
        displayName: 'Transfers',
        transfers: ko.observableArray([]),
        agents: ko.observableArray([]),
        getAgent: function(id) {
            var result = null
            for (var i = 0; i < this.agents().length; i++)
                if (this.agents()[i].id == id)
                    result = this.agents()[i];
            return result;
        },
        activate: function() {
            //the router's activator calls this function and waits for it to complete before proceding
            if (this.transfers().length > 0) {
                return;
            }

            var that = this;

            return http.get('/rest/v1/agents').then(function(response) {
                that.agents(response.agents);
                console.log("Retrieved agents");
                // console.log(JSON.stringify(response, null, 4));
                // console.log(that.transfers().length);
            }).then(function(response) {
                return http.get('/rest/v1/transfers');
            }).then(function(response) {
                for (var i = 0; i < response.transfers.length; i++) {
                    var t = response.transfers[i];
                    var ts = []; 
                    for (var si = 0; si < t.sources.length; si++) {
                        ts.push(that.getAgent(t.sources[si].agentId));
                    }
                    t.sources = ts;
                    var tt = []; 
                    for (var ti = 0; ti < t.targets.length; ti++) {
                        tt.push(that.getAgent(t.targets[ti].agentId));
                    }
                    t.targets = tt;
                    that.transfers.push(t);
                }
                //that.transfers(response.transfers);
                console.log("Retrieved transfers");
                // console.log(JSON.stringify(response, null, 4));
                // console.log(that.transfers().length);
            });
        }
    };
});