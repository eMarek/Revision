// other.js

"use strict";

var r = require("rethinkdb");

var api = {};

/* api/other/find.json
-------------------------------------------------- */
api["other/find.json"] = function find(req, rsp) {

    var exec = require("child_process").exec;

    exec("find /", {
        timeout: 1000,
        maxBuffer: 100 * 1024
    }, function(error, stdout, stderr) {
        rsp.send({
            "find": stdout
        });
    });
};

/* api/other/upload.json
-------------------------------------------------- */
api["other/upload.json"] = function upload(req, rsp) {

    rsp.send({
        "say": "yay",
        "msg": "One day you could upload some data here."
    });
};

/* api/other/users.json
-------------------------------------------------- */
api["other/users.json"] = function users(req, rsp, data) {

    r.db("revision").table("users").run(data.conn, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            rsp.send({
                "say": "yay",
                "users": result
            });
        });
    });
};

/* api/other/whoami.json
-------------------------------------------------- */
api["other/whoami.json"] = function users(req, rsp, data) {

    rsp.send({
        "say": "yay",
        "whoami": data.user
    });
};

module.exports = api;