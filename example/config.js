// config.js

"use strict";

var r = require('rethinkdb');

module.exports = function(server) {

    var config = {};

    // auhor example
    config['author'] = "Marko Bregant";

    // rethink database connection
    r.connect({

        host: "localhost",
        port: 28015

    }, function(err, conn) {

        if (err) throw err;
        config["conn"] = conn;

        // start server
        server(config);
    })

};