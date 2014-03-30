// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var respons, bundle, offset, patch;

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

        // take first patches from waiting stack and reset offset
        bundle = waitingPatches.shift();
        offset = 0;

        // process bundle of patches
        for (var pp in bundle.patches) {

            // single patch in bundle patches
            patch = bundle.patches[pp];

            // validate patch
            if (typeof patch == "object" && patch.hasOwnProperty("a") && patch.hasOwnProperty("s") && (patch.a === "+" && patch.hasOwnProperty("p") || patch.a === "-" && patch.hasOwnProperty("f") && patch.hasOwnProperty("t"))) {

                // adding characters
                if (patch.a === "+") {

                    // operational transformation
                    patch.p = patch.p + offset;
                    offset = offset + patch.s.length;

                    // update current document
                    currentDocument = currentDocument.substr(0, patch.p - 1) + patch.s + currentDocument.substr(patch.p - 1);
                }

                // deleting characters
                if (patch.a === "-") {

                    // operational transformation
                    patch.f = patch.f + offset;
                    patch.t = patch.t + offset;
                    offset = offset - patch.s.length;

                    // update current document
                    currentDocument = currentDocument.substr(0, patch.f - 1) + currentDocument.substr(patch.t);
                }

                // prepare feedback for users
                for (var userID in users) {
                    if (users.hasOwnProperty(userID)) {

                        // push patch to other users
                        if (userID !== bundle.author) {
                            users[userID].patches.push(patch);
                        }
                    }
                }

                // append some extra data to patch
                patch.u = bundle.author;
                patch.x = bundle.timestamp;
                patch.y = new Date().getTime();

                // save patch into the revision diary
                revisionDiary.push(patch);
            }
        }

        // give author an acknowledge
        users[bundle.author].acknowledge = true;
    }
}

setInterval(function() {
    revisioning();
}, 500);