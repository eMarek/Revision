// config.js

"use strict";

var r = require('rethinkdb');

module.exports = function(appRun) {

    var data = {};

    // auhor example
    data['author'] = "Marko Bregant";

    // rethink database connection
    r.connect({

        host: "localhost",
        port: 28015

    }, function(err, conn) {

        if (err) throw err;
        data["conn"] = conn;

        // start server
        appRun(data);
    })

};