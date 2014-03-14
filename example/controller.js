// controller.js

"use strict";

var r = require("rethinkdb");

module.exports = function(req, rsp, data, handler) {

    // example data
    data["thesis"] = "Operational Transformation";

    // public paths
    var publicPaths = ["/api/login.json"];

    if (publicPaths.indexOf(req.url) >= 0) {
        handler(req, rsp, data);
        return;
    }

    // do i have session
    if (!req.headers.hasOwnProperty("session")) {
        rsp.send({
            "say": "out",
            "msg": "Za nadaljevanje se moraš prijaviti."
        });
        return;
    }
    var session = req.headers.session;

    // decrypt session
    var decipher = require("crypto").createDecipher("aes256", data.key);

    try {
        var sessionString = decipher.update(session, "hex", "utf8") + decipher.final("utf8");
        var sessionJSON = JSON.parse(sessionString);

    } catch (err) {
        rsp.send({
            "say": "out",
            "msg": "Seja izgleda pokvarjena."
        });
        return;
    }

    if (!sessionJSON || typeof sessionJSON != "object") {
        rsp.send({
            "say": "out",
            "msg": "Seja je pokvarjena."
        });
        return;
    }

    // check session data
    if (!sessionJSON.userId || !sessionJSON.username || !sessionJSON.ip || !sessionJSON.userAgent || !sessionJSON.key || !sessionJSON.timeStamp) {
        rsp.send({
            "say": "out",
            "msg": "Seja ne vsebuje vseh predvidenih podatkov."
        });
        return;
    }

    // check session adequacy
    if (sessionJSON.ip != req.headers.host || sessionJSON.userAgent != req.headers['user-agent'] || sessionJSON.key != data.key) {
        rsp.send({
            "say": "out",
            "msg": "Podatki seje ne ustrezajo predvidenim podatkom."
        });
        return;
    }

    r.db("revision").table("users").get(sessionJSON.userId).run(data.conn, function(err, result) {
        if (err) throw err;

        var user = result;

        if (!user) {
            rsp.send({
                "say": "out",
                "msg": "Uporabnik iz seje ne obstaja."
            });
            return;
        }

        // user data
        data.user = user;

        // handle request
        handler(req, rsp, data);
    });
};