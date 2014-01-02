"use strict";

define(["plugins/http", "durandal/app", "knockout", "state", "bootstrap"], function (http, app, ko, state, bootstrap) {

    return {
        displayName: "Transfers",
        state: state,
        // Edit dialog
        editTitle: ko.observable(""),
        editId: ko.observable(-1),
        editVersion: ko.observable(-1),
        editName: ko.observable(""),
        editSources: ko.observableArray([]),
        editTargets: ko.observableArray([]),
        editAgentsLeft: ko.observableArray([]),
        editSelectedSource: ko.observable(-1),
        editSelectedTarget: ko.observable(-1),
        newDialog: function() {
            this.editTitle("New Transfer");
            this.editId(-1);
            this.editVersion(-1);
            this.editName("");
            this.editSources([]);
            this.editTargets([]);
            // Shallow copy of agents array (to avoid changing the original)
            this.editAgentsLeft(state.agents().slice());
            this.editSelectedSource(-1);
            $('#myModal').modal();
        },
        editDialog: function(transfer) {
            this.editTitle("Edit Transfer");
            this.editId(transfer.id);
            this.editVersion(transfer.version);
            this.editName(transfer.name);
            this.editSources([]);
            this.editTargets([]);
            // Shallow copy of agents array (to avoid changing the original)
            this.editAgentsLeft(state.agents().slice());
            this.editSelectedSource(-1);
            $('#myModal').modal();
        },
        editAddSource: function(something, e) {
            if (this.editSelectedSource() && this.editSelectedSource() != -1 && this.editSelectedSource() != "") {
                // Add source
                this.editSources.push(this.editSelectedSource());
                // Remove from available agents
                this.editAgentsLeft.remove(function(a) { return a.id == this.editSelectedSource().id; }.bind(this));
                // Reset drop-down
                this.editSelectedSource("");
            }
        },
        editAddTarget: function(something, e) {
            if (this.editSelectedTarget() && this.editSelectedTarget() != -1 && this.editSelectedTarget() != "") {
                // Add target
                this.editTargets.push(this.editSelectedTarget());
                // Remove from available agents
                this.editAgentsLeft.remove(function(a) { return a.id == this.editSelectedTarget().id; }.bind(this));
                // Reset drop-down
                this.editSelectedTarget("");
            }
        },
        test: function(agent) {
            console.log(JSON.stringify(agent));
            return "Hi";
        },
    };
});