// basic.js

"use strict";

module.exports = {
    "/": function(response) {
        console.log("Request handler '/' was called.");
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.write("Hello World!");
        response.end();
    },
    "/find": function(response) {
        var exec = require("child_process").exec;

        console.log("Request handler '/find' was called.");
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
    },
    "/upload": function(response) {
        console.log("Request handler '/upload' was called.");
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.write("Hello Upload!");
        response.end();
    }
}