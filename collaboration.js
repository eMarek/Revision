// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var respons, bundle, offset, patches, originPatch, transformedPatch;

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
        offset = 0;

        // process bundle of patches
        for (var pp in bundle.patches) {

            // single patch in bundle
            originPatch = bundle.patches[pp];

            // validate patch
            if (typeof originPatch == "object" && originPatch.hasOwnProperty("a") && originPatch.hasOwnProperty("s") && (originPatch.a === "+" && originPatch.hasOwnProperty("p") || originPatch.a === "-" && originPatch.hasOwnProperty("f") && originPatch.hasOwnProperty("t"))) {

                // adding characters
                if (originPatch.a === "+") {

                    // finally transformed patch
                    transformedPatch = {
                        "action": originPatch.a,
                        "string": originPatch.s,
                        "length": originPatch.s.length,
                        "position": originPatch.p + offset,
                        "revision": revisionDiary.length,
                        "author": bundle.author,
                        "timestampClient": bundle.timestamp,
                        "timestampServer": new Date().getTime()
                    };

                    // update current document
                    currentDocument = currentDocument.substr(0, transformedPatch.position - 1) + transformedPatch.string + currentDocument.substr(transformedPatch.position - 1);

                    // update offset
                    offset = offset + transformedPatch.length;
                }

                // deleting characters
                if (originPatch.a === "-") {

                    // finally transformed patch
                    transformedPatch = {
                        "action": originPatch.a,
                        "string": originPatch.s,
                        "length": originPatch.s.length,
                        "from": originPatch.f + offset,
                        "to": originPatch.t + offset,
                        "revision": revisionDiary.length,
                        "author": bundle.author,
                        "timestampClient": bundle.timestamp,
                        "timestampServer": new Date().getTime()
                    };

                    // update current document
                    currentDocument = currentDocument.substr(0, transformedPatch.from - 1) + currentDocument.substr(transformedPatch.to);

                    // update offset
                    offset = offset - transformedPatch.length;
                }

                // update revision diary
                revisionDiary.push(transformedPatch);

                // prepare feedback for users
                for (var userID in users) {
                    if (users.hasOwnProperty(userID)) {

                        // push patch to other users
                        if (userID !== bundle.author) {
                            users[userID].patches.push(patch);
                        }
                    }
                }

                console.log(transformedPatch);
                console.log(currentDocument);
            }
        }

        // give author an acknowledge
        users[bundle.author].acknowledge = true;
    }
}

setInterval(function() {
    revisioning();
}, 500);