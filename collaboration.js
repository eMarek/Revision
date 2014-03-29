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

    // initialize
    if (req.payload.initialize || !users.hasOwnProperty(data.user.id)) {

        // remember or reset this user
        users[data.user.id] = {
            acknowledge: false,
            changes: []
        };

        // respond with initializion data
        rsp.send({
            "say": "yay",
            "initialize": {
                "currentDocument": currentDocument,
                "lastRevision": revisionDiary.length
            }
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
        "say": "noo"
    };

    // are previous changes already acknowledged
    if (users[data.user.id].acknowledge) {
        respons["say"] = "yay";
        respons["acknowledge"] = users[data.user.id].acknowledge;

        users[data.user.id].acknowledge = false;
    }

    // are there any new changes from other users
    if (users[data.user.id].changes[0]) {
        respons["say"] = "yay";
        respons["changes"] = users[data.user.id].changes;

        users[data.user.id].changes = [];
    }

    // send respons
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