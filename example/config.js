// config.js

"use strict";

var r = require("rethinkdb");

module.exports = function(data, starter) {

    // auhor example data
    data["author"] = "Marko Bregant";

    // salt and key
    data["salt"] = "DO NOT USE THIS SALT IN PRODUCTION";
    data["key"] = "EITHER THIS KEY";

    // rethink database connection
    r.connect({

        host: "localhost",
        port: 28015

    }, function(err, conn) {

        if (err) throw err;
        data["conn"] = conn;

        // start server
        starter(data);
    })

};