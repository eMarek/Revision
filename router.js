// router.js

"use strict";

var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    child_process = require("child_process");

module.exports = function(handle, request, response) {

    var pathname = url.parse(request.url).pathname;

    if (pathname.slice(0, 5) === "/api/" && pathname.slice(-5) === ".json") {

        // api should response with json data
        pathname = pathname.substring(5);
        if (typeof handle[pathname] === "function") {
            handle[pathname](response);
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
            } else if (stats.isDirectory()) {

                // show list of files in directory
                /*
                var exec = child_process.exec;

                exec("ls -lah " + location, {
                    timeout: 10000,
                    maxBuffer: 20000 * 1024
                }, function(error, stdout, stderr) {
                    response.writeHead(200, {
                        "Content-Type": "text/plain"
                    });
                    response.write(stdout);
                    response.end();
                });
                */
                response.writeHead(404);
                response.write("404 Not Found");
                response.end();

            } else if (stats.isFile()) {

                // response with wanted file
                fs.readFile(location, "binary", function(err, file) {

                    if (err) {
                        response.writeHead(404);
                        response.write("404 Not Found");
                        response.end();
                    } else {
                        response.writeHead(200);
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