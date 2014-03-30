// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var respons, bundle, patches, patch;

var waitingPatches = [];
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
            patches: []
        };

        // respond with initializion data
        rsp.send({
            "say": "yay",
            "initialize": true,
            "currentDocument": currentDocument,
            "revision": revisionDiary.length
        });
        return;
    }

    // prepare data for respond
    respons = {
        "say": "noo"
    };

    // incoming patches
    if (req.payload.patches) {

        // add author information
        req.payload["author"] = data.user.id;

        // push it to waiting patches
        waitingPatches.push(req.payload);

        // yay respons
        respons["say"] = "yay";
        respons["msg"] = "Patches accepted!";
    }

    // are previous patches already acknowledged
    if (users[data.user.id].acknowledge) {
        respons["say"] = "yay";
        respons["acknowledge"] = users[data.user.id].acknowledge;
        respons["revision"] = revisionDiary.length

        users[data.user.id].acknowledge = false;
    }

    // are there any new patches from other users
    if (users[data.user.id].patches[0]) {
        respons["say"] = "yay";
        respons["patches"] = users[data.user.id].patches;
        respons["revision"] = revisionDiary.length

        users[data.user.id].patches = [];
    }

    // send respons
    rsp.send(respons);
};

/* revisioning
-------------------------------------------------- */
function revisioning() {
    if (waitingPatches[0]) {

        // take first patches from waiting stack
        bundle = waitingPatches.shift();

        // process bundle of patches
        for (var pp in bundle.patches) {

            // single patch in bundle
            patch = bundle.patches[pp];

            // validate patch
            if (typeof patch == "object") {

                // upgrade revision and add author and timestamp
                patch["revision"] = revisionDiary.length;
                patch["author"] = bundle.author;
                patch["timestampClient"] = bundle.timestamp;
                patch["timestampServer"] = new Date().getTime();

                // operational transformation
                if (patch.a === "+") {
                    currentDocument = currentDocument.substr(0, patch.p) + patch.s + currentDocument.substr(patch.p);
                }

                if (patch.a === "-") {
                    currentDocument = currentDocument.substr(0, patch.f - 1) + currentDocument.substr(patch.t);
                }

                // update revision diary
                revisionDiary.push(patch);

                // prepare feedback for users
                for (var userID in users) {
                    if (users.hasOwnProperty(userID)) {

                        // push patch to other users
                        if (userID !== bundle.author) {
                            users[userID].patches.push(patch);
                        }
                    }
                }
            }
        }

        // give author an acknowledge
        users[bundle.author].acknowledge = true;
    }
}

setInterval(function() {
    revisioning();
}, 500);