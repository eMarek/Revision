// server.js

"use strict";

var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    router = require("./router.js");

var api = {};
var config = {};

/* app run
-------------------------------------------------- */
function appRun(userConfig) {

    // config
    config = (typeof userConfig != "object") ? {} : userConfig;

    // memorize ali api handlers
    var cwd = process.cwd();
    var location = cwd + "/api";

    var handlers, pathname;

    fs.readdirSync(location).forEach(function(file) {

        if (file.charAt(0) == ".") {
            return;
        }

        handlers = require(location + "/" + file);

        for (pathname in handlers) {
            api["/api/" + pathname] = handlers[pathname];
        }
    });

    // create http server
    http.createServer(onRequest).listen(8888);
    console.log("http://127.0.0.1:8888");
}

/* on request
-------------------------------------------------- */
function onRequest(request, response) {
    router(api, request, response, config);
}

/* exports run
-------------------------------------------------- */
exports.run = function() {

    // looks for user config module
    var cwd = process.cwd();
    var location = cwd + "/config.js";

    fs.stat(location, function(err, stats) {

        if (err) {
            // start server
            appRun();
        } else {
            // load config and then start server
            var config = require(location);
            config(appRun);
        }
    });
};