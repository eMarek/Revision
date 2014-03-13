// default.js

"use strict";

var r = require('rethinkdb');

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
api["login.json"] = function login(request, response, data) {

    var rsp = {};
    var username = request.payload.username;
    var password = request.payload.password;

    var hash = require("crypto").createHash("sha256").update(password).digest("hex");

    r.db("revision").table("users").filter({
        "username": username,
        "password": hash
    }).limit(1).run(data.conn, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {

            if (result[0]) {
                rsp = {
                    "say": "yay",
                    "msg": "Prijava je uspela!",
                    "user": result[0]["name"] + " " + result[0]["surname"],
                    "session": "m43iafguhal843aefhialerl83i5uhgsauhfliw43uyghserghrkfdg"
                };
            } else {
                rsp = {
                    "say": "noo",
                    "msg": "Prijava ni uspela!"
                };
            }

            response.send(rsp);
        });
    });
};

module.exports = api;