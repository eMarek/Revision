// collaboration.js

"use strict";

var waitingChanges = [];
var revisionDiary = [];
var currentDocument = "";

module.exports = function example(req, rsp, data) {

    if (req.payload.initialize) {
        rsp.send({
            "say": "yay",
            "initialize": true,
            "currentDocument": currentDocument,
            "lastRevision": revisionDiary.length
        });
        return;
    }

    if (req.payload.changes) {
        rsp.send({
            "say": "yay",
            "msg": "Workin' on it!"
        });
        return;
    }

    rsp.send({
        "say": "noo",
        "msg": "Ne vem kaj narediti?!"
    });
};