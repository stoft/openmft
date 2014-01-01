"use strict";

define(["plugins/http", "durandal/app", "knockout", "state"], function (http, app, ko, state) {

    return {
        displayName: "Agents",
        // agents: ko.observableArray([]),
        state: state,
        activate: function () {
            //the router's activator calls this function and waits for it to complete before proceding
            // if (this.agents().length > 0) {
            //     return;
            // }

            // var that = this;

            // return http.get("/rest/v1/agents").then(function(response) {
            //     that.agents(response.agents);
            //     console.log(JSON.stringify(response, null, 4));
            //     console.log(that.agents().length);
            // });
        }
    };
});