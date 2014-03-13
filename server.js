// server.js

"use strict";

var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    child_process = require("child_process"),
    querystring = require("querystring"),
    mime = require("./mime.js");

var config = false;
var controller = false;

var cwd = process.cwd();

/* variables
-------------------------------------------------- */
var api = {};
var data = {};

/* exports run
-------------------------------------------------- */
exports.run = function() {

    // looks for user CONFIG file
    var configFile = cwd + "/config.js";

    if (fs.existsSync(configFile)) {

        // require user config module and then start server
        config = require(configFile);
        config(appRun);

    } else {

        // start server
        appRun();
    }
};

/* app run
-------------------------------------------------- */
function appRun(passingData) {

    // passing config data
    data = (typeof passingData != "object") ? {} : passingData;

    // looks for user CONTROLLER file
    var controllerFile = cwd + "/controller.js";

    if (fs.existsSync(controllerFile)) {

        // require user controller module
        controller = require(controllerFile);
    }

    // looks for user API directory
    var apiDir = cwd + "/api";

    fs.readdirSync(apiDir).forEach(function(file) {

        if (file.charAt(0) == ".") {
            return;
        }

        // memorize ali api handlers
        var handlers = require(apiDir + "/" + file);

        for (var pathname in handlers) {
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

    // pathname
    var pathname = url.parse(request.url).pathname;

    // direction every request on basis of pathname
    if (pathname.slice(0, 5) === "/api/" && pathname.slice(-5) === ".json" && (request.method === "POST" || request.method === "GET")) {

        if (typeof controller === "function") {

            // execute controller and then handle request
            controller(request, response, data, handler);

        } else {

            // handle request
            handler(request, response, data);
        }

    } else {

        // force to load index.html on default pathname
        if (pathname === "/") {
            pathname = "/index.html"
        }

        // public files and folders location
        var location = cwd + "/public" + pathname;

        // check the existence of requested location
        fs.stat(location, function(err, stats) {

            if (err) {
                response.writeHead(404);
                response.write("404 Not Found");
                response.end();

            } else if (stats.isFile()) {

                // respond with wanted file
                fs.readFile(location, "binary", function(err, file) {

                    if (err) {
                        response.writeHead(404);
                        response.write("404 Not Found");
                        response.end();
                    } else {

                        // mime type
                        if (pathname.split(".").length > 1) {
                            var extension = pathname.split(".").pop();
                            var mimeType = mime[extension];
                        } else {
                            var mimeType = "text/plain";
                        }

                        response.writeHead(200, {
                            "Content-Type": mimeType
                        });
                        response.write(file, "binary");
                        response.end();
                    }
                });

            } else {
                response.writeHead(404);
                response.write("404 Not Found");
                response.end();
            }
        });
    }
}

/* handle request
-------------------------------------------------- */
function handler(request, response, passingData) {

    // passing config and controller data
    var data = (typeof passingData != "object") ? {} : passingData;

    // pathname
    var pathname = url.parse(request.url).pathname;

    // looking for an api handler in api folder
    if (typeof api[pathname] === "function") {

        // gathering request payload from body
        var payload = "";
        request.on("data", function(chunk) {
            // append the current chunk of data to the payload variable
            payload += chunk.toString();
        });

        // received all data
        request.on("end", function() {

            // parse the received payload
            request.payload = {};

            if (request.headers.hasOwnProperty("content-type")) {

                if (request.headers["content-type"].slice(0, 16) == "application/json") {

                    try {
                        request.payload = JSON.parse(payload);
                    } catch (err) {
                        request.payload.error = payload;
                    }

                } else if (request.headers["content-type"].slice(0, 19) == "multipart/form-data") {

                    request.payload = {
                        "form-data": payload
                    };

                } else if (request.headers["content-type"].slice(0, 33) == "application/x-www-form-urlencoded") {

                    try {
                        request.payload = querystring.parse(payload);
                    } catch (err) {
                        request.payload.error = payload;
                    }

                } else {
                    request.payload = payload;
                }
            }

            // preparation for sending response
            response.send = function(data) {

                response.writeHead(200, {
                    "Content-Type": "text/json"
                });

                var rsp = (typeof data != "object") ? {} : data;

                response.write(JSON.stringify(rsp));
                response.end();
            }

            // calling api
            api[pathname](request, response, config);
        });

    } else {
        response.writeHead(404);
        response.write("404 Not Found");
        response.end();
    }
}