// other.js

"use strict";
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
            find: stdout
        });
    });
};

/* api/other/upload.json
-------------------------------------------------- */
api["other/upload.json"] = function upload(request, response) {

    response.send({
        msg: "One day you could upload some data here."
    });
};

module.exports = api;