requirejs.config({
    paths: {
        "text": "../vendor/requirejs-text/text",
        "knockout": "../vendor/knockout.js/knockout",
        "jquery": "../vendor/jquery/jquery",
        "bootstrap": "../vendor/bootstrap/bootstrap",
        "durandal":"../vendor/durandal",
        "async":"../vendor/async/async",
        "underscore":"../vendor/underscore/underscore",
        "plugins" : "../vendor/durandal/plugins",
        "transitions" : "../vendor/durandal/transitions"
    },
    shim: {
        "underscore": {
          exports: '_'
        },
        "bootstrap": {
            deps: ["jquery"],
            exports: "jQuery"
        }
    }
});

define(function(require) {
    "use strict";
    
    var app = require("durandal/app"),
        viewLocator = require("durandal/viewLocator"),
        system = require("durandal/system");

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = "OpenMFT";

    app.configurePlugins({
        router:true,
        dialog: true,
        widget: true
    });

    app.start().then(function() {
        //Replace "viewmodels" in the moduleId with "views" to locate the view.
        //Look for partial views in a "views" folder in the root.
        viewLocator.useConvention();

        //Show the app by setting the root view model for our application with a transition.
        app.setRoot("viewmodels/shell", "entrance");
        system.log("Again");
    });
});