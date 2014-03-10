// default.js

"use strict";
var api = {};

/* api/example.json
-------------------------------------------------- */
api["example.json"] = function example(response) {

    var sth = {
        "action": "hug me",
        "when": "right now",
        "where": "exactly here"
    };

    response.writeHead(200, {
        "Content-Type": "text/json"
    });
    response.write(JSON.stringify(sth));
    response.end();

};

module.exports = api;