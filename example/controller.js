// controller.js

"use strict";

var r = require("rethinkdb");

module.exports = function(req, rsp, data, handler) {

    // example data
    data["thesis"] = "Operational Transformation";

    // checking session
    if (!req.headers.hasOwnProperty("session") && req.url != "/api/login.json") {

        rsp.send({
            "say": "out"
        });

    } else {

        var session = req.headers.session;
        handler(req, rsp, data);
    }
};