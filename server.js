// server.js

"use strict";

var http = require("http"),
    fs = require("fs"),
    child_process = require("child_process"),
    querystring = require("querystring"),
    mime = require("./mime.js"),
    collaboration = require("./collaboration.js");

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

    // include collaboration in api
    api["/api/collaboration.json"] = collaboration;

    // looks for user CONFIG file
    var configFile = cwd + "/config.js";

    if (fs.existsSync(configFile)) {

        // require user config module and then start server
        config = require(configFile);
        config(data, starter);

    } else {

        // start server
        starter();
    }
};

/* starter
-------------------------------------------------- */
function starter(passingData) {

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
    var pathname = request.url;

    // direction every request on basis of pathname
    if (pathname.slice(0, 5) === "/api/" && pathname.slice(-5) === ".json" && request.method === "POST") {

        // preparation for sending response
        response.send = function(passingData) {

            response.writeHead(200, {
                "Content-Type": "text/json"
            });

            var rsp = (typeof passingData != "object") ? {} : passingData;

            try {
                rsp = JSON.stringify(rsp, function(key, value) {
                    if (key == "rawSocket") {
                        return "...";
                    } else {
                        return value;
                    };
                });
            } catch (err) {
                rsp = JSON.stringify({
                    "say": "noo",
                    "msg": "Odgovora ti ne morem poslati."
                });
            }

            response.write(rsp);
            response.end();
        };

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

/* handler
-------------------------------------------------- */
function handler(request, response, passingData) {

    // passing config and controller data
    var data = (typeof passingData != "object") ? {} : passingData;

    // pathname
    var pathname = request.url;

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

            // calling api
            api[pathname](request, response, data);
        });

    } else {
        response.writeHead(404);
        response.write("404 Not Found");
        response.end();
    }
}