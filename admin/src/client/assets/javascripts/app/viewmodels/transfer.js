define(['plugins/http', 'durandal/app', 'knockout'], function (http, app, ko) {

    return {
        displayName: 'Transfers',
        transfers: ko.observableArray([]),
        activate: function () {
            //the router's activator calls this function and waits for it to complete before proceding
            if (this.transfers().length > 0) {
                return;
            }

            var that = this;

            return http.get('/rest/v1/transfers').then(function(response) {
                that.transfers(response);
                console.log(JSON.stringify(response, null, 4));
                console.log(that.transfers().length);
            });
        }
    };
});