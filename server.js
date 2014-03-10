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
var handle = require("../../api/basic.js");

exports.run = function() {

    function onRequest(request, response) {
        router(handle, request, response);
    }

    http.createServer(onRequest).listen(8888);
    console.log("Server has started.");
};