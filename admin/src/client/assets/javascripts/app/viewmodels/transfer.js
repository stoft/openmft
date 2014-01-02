"use strict";

define(["plugins/http", "durandal/app", "knockout", "state", "bootstrap"], function (http, app, ko, state, bootstrap) {

    return {
        displayName: "Transfers",
        state: state,
        // Edit dialog
        editTitle: ko.observable(""),
        editId: ko.observable(0),
        editVersion: ko.observable(1),
        editName: ko.observable(""),
        editSources: ko.observableArray([]),
        editTargets: ko.observableArray([]),
        editAgentsLeft: ko.observableArray([]),
        editSelectedSource: ko.observable(""),
        newDialog: function() {
            this.editTitle("New Transfer");
            this.editId(0);
            this.editVersion(1);
            this.editName("");
            this.editSources([]);
            this.editTargets([]);
            this.editAgentsLeft(state.agents());
            this.editSelectedSource("");
            $('#myModal').modal();
        },
        editDialog: function(transfer) {
            this.editTitle("Edit Transfer");
            this.editId(transfer.id);
            this.editVersion(transfer.version);
            this.editName(transfer.name);
            this.editSources([]);
            this.editTargets([]);
            this.editAgentsLeft(state.agents());
            this.editSelectedSource("");
            $('#myModal').modal();
        },
        editAddSource: function(agent, e) {
            if (editSelectedSource() != "") {
                console.log("editAddSource: ");
                console.log(e);
                this.editSources.push(agent);
                this.editAgentsLeft.remove(function(a) { return a.id == agent.id; });
            }
        },
        test: function(agent) {
            console.log(JSON.stringify(agent));
            return "Hi";
        },
    };
});