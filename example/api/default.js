// default.js

"use strict";

var r = require("rethinkdb");

var api = {};

/* api/password.json
-------------------------------------------------- */
api["password.json"] = function example(req, rsp) {

    var password = req.payload.password;

    var hash = require("crypto").createHash("sha256").update(password).digest("hex");

    rsp.send({
        "say": "yay",
        "hash": hash
    });
};

/* api/crypte.json
-------------------------------------------------- */
api["crypte.json"] = function crypte(req, rsp, data) {

    var text = req.payload.text;

    if (!text) {
        rsp.send({
            "say": "noo",
            "msq": "Pošlji nekaj besedila, da ga bom lahko zakriptiral!"
        });
        return;
    }

    var crypto = require("crypto");

    var algorithm = "aes256";
    var key = data.key;

    var cipher = crypto.createCipher(algorithm, key);
    var encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");

    var decipher = crypto.createDecipher(algorithm, key);
    var decrypted = decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");

    rsp.send({
        "say": "yay",
        "text": text,
        "encrypted": encrypted,
        "decrypted": decrypted
    });
}

/* api/login.json
-------------------------------------------------- */
api["login.json"] = function login(req, rsp, data) {

    var joy = {};
    var username = req.payload.username;
    var password = req.payload.password;

    var hash = require("crypto").createHash("sha256").update(password).digest("hex");

    r.db("revision").table("users").filter({
        "username": username,
        "password": hash
    }).limit(1).run(data.conn, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {

            if (result[0]) {
                joy = {
                    "say": "yay",
                    "msg": "Prijava je uspela!",
                    "user": result[0]["name"] + " " + result[0]["surname"],
                    "session": "m43iafguhal843aefhialerl83i5uhgsauhfliw43uyghserghrkfdg"
                };
            } else {
                joy = {
                    "say": "noo",
                    "msg": "Prijava ni uspela!"
                };
            }

            rsp.send(joy);
        });
    });
};

module.exports = api;