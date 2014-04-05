// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var respons = {},
    bundle, patches, patch, offset;

var waitingPatches = [];
var revisionDiary = [];
var currentDocument = "";
var users = {};

/* collaboration
-------------------------------------------------- */
module.exports = function collaboration(req, rsp, data) {

    // forced initialization or new user
    if (req.payload.initialization || !users.hasOwnProperty(data.user.id)) {

        // remember user
        users[data.user.id] = true;

        // respond with initialization data
        rsp.send({
            "currentDocument": currentDocument,
            "revisionDiary": revisionDiary,
            "revision": revisionDiary.length
        });

    } else {

        // new incoming patches from current user
        if (req.payload.patches) {

            // prepare bundle
            bundle = {
                "author": data.user.id,
                "patches": req.payload.patches,
                "timestamp": new Date().getTime()
            };

            // calculate offset for incoming patches
            offset = 0;
            for (var rd in revisionDiary) {
                if (rd >= req.payload.revision) {

                    for (var pc in revisionDiary[rd].patches) {
                        patch = revisionDiary[rd].patches[pc];

                        // some characteres were added
                        if (patch.a === "+") {

                            for (var bp in bundle.patches) {
                                if (bundle.patches[bp].a === "+" && bundle.patches[bp].p >= patch.p) {
                                    offset = offset + patch.s.length;
                                }
                                if (bundle.patches[bp].a === "-" && bundle.patches[bp].f >= patch.p) {
                                    offset = offset + patch.s.length;
                                }
                            }
                        }

                        // some characteres were deleted
                        if (patch.a === "-") {

                            for (var bp in bundle.patches) {
                                if (bundle.patches[bp].a === "+" && bundle.patches[bp].p >= patch.p) {
                                    offset = offset - patch.s.length;
                                }
                                if (bundle.patches[bp].a === "-" && bundle.patches[bp].f >= patch.p) {
                                    offset = offset - patch.s.length;
                                }
                            }
                        }
                    }
                }
            }

            // process bundle patches
            for (var bc in bundle.patches) {
                patch = bundle.patches[bc];

                // validate patch
                if (typeof patch == "object" && patch.hasOwnProperty("a") && patch.hasOwnProperty("s") && (patch.a === "+" && patch.hasOwnProperty("p") || patch.a === "-" && patch.hasOwnProperty("f") && patch.hasOwnProperty("t"))) {

                    // adding characters
                    if (patch.a === "+") {

                        // take offset into account
                        patch.p = patch.p + offset;

                        // update current document
                        currentDocument = currentDocument.substr(0, patch.p - 1) + patch.s + currentDocument.substr(patch.p - 1);
                    }

                    // deleting characters
                    if (patch.a === "-") {

                        // take offset into account
                        patch.f = patch.f + offset;
                        patch.t = patch.t + offset;

                        // update current document
                        currentDocument = currentDocument.substr(0, patch.f - 1) + currentDocument.substr(patch.t);
                    }
                }
            }

            // push bundle to revision diary
            revisionDiary.push(bundle);
        }

        // do we have new patches in revision diary
        if (revisionDiary.length > req.payload.revision) {
            rsp.send({
                "revisionDiary": revisionDiary.slice(req.payload.revision),
                "revision": revisionDiary.length
            });
        } else {
            rsp.send({
                "revision": revisionDiary.length
            });
        }
    }
};