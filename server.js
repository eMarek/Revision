// server.js

"use strict";

var http = require("http");
var url = require("url");
var router = require("./router.js");
/*
require("fs").readdirSync("./controllers").forEach(function(file) {
    require("./controllers/" + file);
});
*/
var handle = require("./example/controllers/basic.js");

function run() {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        router(handle, pathname, response);
    }

    http.createServer(onRequest).listen(8888);
    console.log("Server has started.");
}

exports.run = run;