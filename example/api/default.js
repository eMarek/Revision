// default.js

"use strict";
var api = {};

/* api/example.json
-------------------------------------------------- */
api["password.json"] = function example(request, response) {

    var password = request.payload.password;

    var hash = require("crypto").createHash("sha256").update(password).digest("hex");

    response.send({
        "hash": hash
    });
};

/* api/login.json
-------------------------------------------------- */
api["login.json"] = function login(request, response) {

    var username = request.payload.username;
    var password = request.payload.password;

    response.send({
        "username": username,
        "password": password,
        "hello": "user"
    });
};

module.exports = api;