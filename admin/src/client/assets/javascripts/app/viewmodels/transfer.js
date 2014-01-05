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
            var agents = [];
            for (var i = 0; i < state.agents().length; i++) {
                agents.push(state.agents()[i]());
            }
            this.editAgentsLeft(agents);
            this.editSelectedSource(-1);
            $("#myModal").modal();
        },
        editDialog: function(transfer) {
            this.editTitle("Edit Transfer");
            this.editId(transfer.id);
            this.editVersion(transfer.version);
            this.editName(transfer.name);
            this.editSources([]);
            this.editTargets([]);
            this.editAgentsLeft([]);
            // Complicated code to sort agents into sources, targets and non-used...
            for (var i = 0; i < state.agents().length; i++) {
                var agent = state.agents()[i]();
                var found = false;
                for (var s = 0; s < transfer.sources.length && !found; s++) {
                    if (agent.id == transfer.sources[s].agentId) {
                        found = true;
                        this.editSources.push(agent);
                    }
                }
                for (var t = 0; t < transfer.targets.length && !found; t++) {
                    if (agent.id == transfer.targets[t].agentId) {
                        found = true;
                        this.editTargets.push(agent);
                    }
                }
                if (! found) {
                    this.editAgentsLeft.push(agent);
                }
            }
            this.editSelectedSource(-1);
            $("#myModal").modal();
        },
        saveTransfer: function() {
            var transfer = {
                id: this.editId(),
                version: this.editVersion(),
                name: this.editName(),
                sources: [],
                targets: []
            };
            for (var i = 0; i < this.editSources().length; i++) {
                transfer.sources.push({agentId: this.editSources()[i].id});
            }
            for (var j = 0; j < this.editTargets().length; j++) {
                transfer.targets.push({agentId: this.editTargets()[j].id});
            }
            this.state.saveTransfer(transfer);
            $("#myModal").modal("hide");
        },
        editAddSource: function() {
            if (this.editSelectedSource() && this.editSelectedSource() !== -1 && this.editSelectedSource() !== "") {
                // console.log(this.editSelectedSource());
                // Add source
                this.editSources.push(this.editSelectedSource());
                // Remove from available agents
                this.editAgentsLeft.remove(function(a) { return a.id == this.editSelectedSource().id; }.bind(this));
                // Reset drop-down
                this.editSelectedSource("");
            }
        },
        editAddTarget: function() {
            if (this.editSelectedTarget() && this.editSelectedTarget() !== -1 && this.editSelectedTarget() !== "") {
                // Add target
                this.editTargets.push(this.editSelectedTarget());
                // Remove from available agents
                this.editAgentsLeft.remove(function(a) { return a.id == this.editSelectedTarget().id; }.bind(this));
                // Reset drop-down
                this.editSelectedTarget("");
            }
        },
        editRemoveSource: function(agent) {
            this.editSources.remove(agent);
            this.editAgentsLeft.push(agent);
        },
        editRemoveTarget: function(agent) {
            this.editTargets.remove(agent);
            this.editAgentsLeft.push(agent);
        },
        removeTransfer: function(transfer) {
            this.state.removeTransfer(transfer);
        },
        test: function(agent) {
            console.log(JSON.stringify(agent));
            return "Hi";
        },
        compositionComplete: function() { // parameters: view, parent
            // Focus on transfer name when showing edit dialog
            $("#myModal").on("shown.bs.modal", function() {
                $("#transferName").focus();
            });
            // Click "Save" on enter when showing edit dialog
            $("#myModal").keypress(function(e) {
                if(e.which == 13) {
                    e.target.blur();
                    this.saveTransfer();
                }
                return true;
            }.bind(this));
        }
    };
});