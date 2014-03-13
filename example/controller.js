// controller.js

"use strict";

var r = require('rethinkdb');

module.exports = function(req, rsp, data, handler) {

    // example data
    data['goal'] = "Operational Transformation";

    // checking authorization
    if (req.headers.hasOwnProperty("authorization") && req.url != "/api/login.json") {

        var authorization = req.headers.authorization;

        rsp.send({
            "say": "out"
        });

    } else {
        handler(req, rsp, data);
    }
};