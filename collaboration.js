// collaboration.js

"use strict";

var waitingChanges = [];
var revisionDiary = [];
var currentDocument = "";

module.exports = function example(req, rsp, data) {

    if (req.payload.operation === "init") {
        rsp.send({
            "say": "yay",
            "currentDocument": currentDocument,
            "lastRevision": revisionDiary.length
        });
        return;
    }

    rsp.send({
        "say": "noo",
        "msg": "Ne vem kaj narediti!"
    });
};