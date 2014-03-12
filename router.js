// router.js

"use strict";

var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    child_process = require("child_process"),
    querystring = require("querystring"),
    mime = require("./mime.js");

module.exports = function(api, request, response, config) {

    var pathname = url.parse(request.url).pathname;

    if (pathname.slice(0, 5) === "/api/" && pathname.slice(-5) === ".json" && (request.method === "POST" || request.method === "GET")) {

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

    } else {

        // force to load index.html on default pathname
        if (pathname === "/") {
            pathname = "/index.html"
        }

        // public files and folders location
        var cwd = process.cwd();
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