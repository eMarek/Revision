// controller.js

"use strict";

var r = require('rethinkdb');

module.exports = function(request, response, data, handler) {

    // example data
    data['goal'] = "Operational Transformation";

    // checking authorization
    if (request.headers.hasOwnProperty("authorization") && request.url != "/api/login.json") {

        var authorization = request.headers.authorization;

        response.send({
            "say": "out"
        });

    } else {
        handler(request, response, data);
    }
};