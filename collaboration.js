// collaboration.js

"use strict";

var serverData = {
    "waitingChanges": [],
    "revisionDiary": [],
    "currentDocument": ""
};

module.exports = function example(req, rsp, data) {

    if (req.payload.operation === "init") {
        rsp.send({
            "say": "yay",
            "currentDocument": serverData.currentDocument
        });
        return;
    }

    rsp.send({
        "say": "noo",
        "msg": "Ne vem kaj narediti!"
    });
};