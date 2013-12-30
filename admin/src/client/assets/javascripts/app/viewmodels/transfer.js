﻿define(function() {
    var ctor = function () {
        this.displayName = 'Welcome to the OpenMFT Administrator!';
        this.description = 'yada yada';
        this.features = [
            'Loads of fun',
            'Simple to use',
            'Just works'
        ];
    };

    //Note: This module exports a function. That means that you, the developer, can create multiple instances.
    //This pattern is also recognized by Durandal so that it can create instances on demand.
    //If you wish to create a singleton, you should export an object instead of a function.
    //See the "flickr" module for an example of object export.

    return ctor;
});