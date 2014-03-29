// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var waitingChanges = [];
var revisionDiary = [];
var currentDocument = "";
var users = {};

/* collaboration
-------------------------------------------------- */
module.exports = function collaboration(req, rsp, data) {

    // checking
    var checking = {
        "waitingChanges": waitingChanges,
        "revisionDiary": revisionDiary,
        "currentDocument": currentDocument,
        "users": users
    };

    // initialize
    if (req.payload.initialize) {

        // remember or reset this user
        if (!users.hasOwnProperty(data.user.id)) {
            users[data.user.id] = {
                acknowledge: false,
                changes: []
            };
        } else {
            users[data.user.id]["acknowledge"] = false;
            users[data.user.id]["changes"] = [];
        }

        // respond with initializion data
        rsp.send({
            "say": "yay",
            "initialize": true,
            "currentDocument": currentDocument,
            "lastRevision": revisionDiary.length
        });
        return;
    }

    // changes
    if (req.payload.changes) {
        var changes = req.payload.changes;
        changes["i"] = data.user.id;
        waitingChanges.push(req.payload.changes);
    }

    // prepare data for respond
    var respons = {
        "checking": {
            "waitingChanges": waitingChanges,
            "revisionDiary": revisionDiary,
            "currentDocument": currentDocument,
            "users": users
        },
        "say": "yay",
        "acknowledge": users[data.user.id].acknowledge,
        "changes": users[data.user.id].changes
    }

    users[data.user.id].acknowledge = false;
    users[data.user.id].changes = [];

    rsp.send(respons);
};

/* revisioning
-------------------------------------------------- */
function revisioning() {
    if (waitingChanges[0]) {

        // take first changes from waiting stack
        var changes = waitingChanges.shift();

        // fix revision number
        changes.r = revisionDiary.length;

        // prepare feedback for users
        for (var userID in users) {
            if (users.hasOwnProperty(userID)) {

                // acknowledge author or push changes to other users
                if (userID === changes.i) {
                    users[userID].acknowledge = true;
                } else {
                    users[userID].changes.push(changes);
                }
            }
        }

        // update revision diary
        revisionDiary.push(changes);
    }
}

setInterval(function() {
    revisioning();
}, 500);