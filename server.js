// server.js

"use strict";

var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    router = require("./router.js");

exports.run = function() {

    // memorize ali api handlers
    var api = {};
    var handlers, pathname;

    var cwd = process.cwd();
    var location = cwd + "/api";

    fs.readdirSync(location).forEach(function(file) {

        if (file.charAt(0) == ".") {
            return;
        }

        handlers = require(location + "/" + file);

        for (pathname in handlers) {
            api["/api/" + pathname] = handlers[pathname];
        }
    });

    // start server
    function onRequest(request, response) {
        router(api, request, response);
    }

    http.createServer(onRequest).listen(8888);
    console.log("http://127.0.0.1:8888");
};