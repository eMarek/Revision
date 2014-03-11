// default.js

"use strict";
var api = {};

/* api/example.json
-------------------------------------------------- */
api["example.json"] = function example(request, response) {

    var sth = {
        "status": "okay",
        "action": "hug me",
        "when": "right now",
        "where": "exactly here"
    };

    console.log(require("util").inspect(sth, {
        showHidden: true,
        colors: true
    }));

    response.send(sth);
};

/* api/login.json
-------------------------------------------------- */
api["login.json"] = function login(request, response) {

    var username = request.payload.username;
    var password = request.payload.password;

    response.send({
        username: username,
        password: password,
        hello: "user"
    });
};

module.exports = api;