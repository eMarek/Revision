// server.js

"use strict";

var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    router = require("./router.js");

var cwd = process.cwd();
var location;

function server(data) {

    // config
    var config = (typeof data != "object") ? {} : data;

    // memorize ali api handlers
    var api = {};
    var handlers, pathname;

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
        router(api, request, response, config);
    }

    http.createServer(onRequest).listen(8888);
    console.log("http://127.0.0.1:8888");
}

exports.run = function() {

    // config module
    var location = cwd + "/config.js";

    fs.stat(location, function(err, stats) {

        if (err) {
            // start server
            server();
        } else {
            // run config and then start server
            var config = require(location);
            config(server);
        }

    });
};