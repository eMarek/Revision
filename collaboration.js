// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var respons, changes, change, author, timestamp, editingDocument;

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
            "initialize": true,
            "currentDocument": currentDocument,
            "lastRevision": revisionDiary.length
        });
        return;
    }

    // incoming changes
    if (req.payload.changes) {
        changes = req.payload.changes;
        changes.unshift(data.user.id);
        waitingChanges.push(changes);
    }

    // prepare data for respond
    respons = {
        "say": "noo"
    };

    // are previous changes already acknowledged
    if (users[data.user.id].acknowledge) {
        respons["say"] = "yay";
        respons["acknowledge"] = users[data.user.id].acknowledge;
        respons["lastRevision"] = revisionDiary.length

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
        changes = waitingChanges.shift();
        author = changes[0];
        timestamp = new Date().getTime();

        // process bundle of changes
        for (var cc in changes) {

            // single change in bundle
            change = changes[cc];

            // validate change
            if (typeof change == "object") {

                // upgrade revision and add author and timestamp
                change.r = revisionDiary.length;
                change.i = author;
                change.q = timestamp;

                // operational transformation
                if (change.a === "+") {

                    editingDocument = currentDocument.substr(0, change.p) + change.s + currentDocument.substr(change.p);
                    currentDocument = editingDocument;
                }

                if (change.a === "-") {

                    editingDocument = currentDocument.substr(0, change.f - 1) + currentDocument.substr(change.t);
                    currentDocument = editingDocument;
                }

                // update revision diary
                revisionDiary.push(change);

                // prepare feedback for users
                for (var userID in users) {
                    if (users.hasOwnProperty(userID)) {

                        // push change to other users
                        if (userID !== author) {
                            users[userID].changes.push(change);
                        }
                    }
                }
            }
        }

        // give author an acknowledge
        users[author].acknowledge = true;
    }
}

setInterval(function() {
    revisioning();
}, 500);