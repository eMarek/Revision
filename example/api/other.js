// other.js

"use strict";

var r = require('rethinkdb');

var api = {};

/* api/other/find.json
-------------------------------------------------- */
api["other/find.json"] = function find(request, response) {

    var exec = require("child_process").exec;

    exec("find /", {
        timeout: 10000,
        maxBuffer: 20000 * 1024
    }, function(error, stdout, stderr) {
        response.send({
            "find": stdout
        });
    });
};

/* api/other/upload.json
-------------------------------------------------- */
api["other/upload.json"] = function upload(request, response) {

    response.send({
        "msg": "One day you could upload some data here."
    });
};

/* api/other/users.json
-------------------------------------------------- */
api["other/users.json"] = function find(request, response, data) {

    r.db("revision").table("users").run(data.conn, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            response.send(result);
        });
    });

};

module.exports = api;