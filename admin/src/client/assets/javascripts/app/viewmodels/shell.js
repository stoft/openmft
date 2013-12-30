﻿define(['plugins/router', 'durandal/app'], function (router, app) {
    return {
        router: router,
        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function () {
            router.map([
                { route: '', title:'Agents', moduleId: 'viewmodels/agent', nav: false },
                { route: 'agent', title:'Agents', moduleId: 'viewmodels/agent', nav: true },
                { route: 'transfer', title:'Transfers', moduleId: 'viewmodels/transfer', nav: true }
            ]).buildNavigationModel();
            
            return router.activate();
        }
    };
});