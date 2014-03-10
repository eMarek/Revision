// other.js

"use strict";
var api = {};

/* api/other/find.json
-------------------------------------------------- */
api["other/find.json"] = function find(response) {

    var exec = require("child_process").exec;

    exec("find /", {
        timeout: 10000,
        maxBuffer: 20000 * 1024
    }, function(error, stdout, stderr) {
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.write(stdout);
        response.end();
    });

};

/* api/other/upload.json
-------------------------------------------------- */
api["other/upload.json"] = function upload(response) {

    response.writeHead(200, {
        "Content-Type": "text/json"
    });
    response.write("One day you will be upload some data here.");
    response.end();

};

module.exports = api;