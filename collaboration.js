// collaboration.js

"use strict";

module.exports = function example(req, rsp, data) {

    rsp.send({
        "say": "yay",
        "collaboration": true
    });
};