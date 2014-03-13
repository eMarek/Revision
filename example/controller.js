// controller.js

"use strict";

module.exports = function(handler, request, response) {

    console.log("CONTROLLER");

    handler(request, response);
};