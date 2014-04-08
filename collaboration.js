// collaboration.js

"use strict";

/* globals
-------------------------------------------------- */
var bundle, patch, offset;

var revisionDiary = [];
var currentDocument = "";
var users = {};

/* collaboration
-------------------------------------------------- */
module.exports = function collaboration(req, rsp, data) {

    // forced initialization or new user
    if (req.payload.revision == -1 || !users.hasOwnProperty(data.user.id)) {

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
        if (req.payload.patch) {

            // prepare bundle
            bundle = {
                "author": data.user.id,
                "patch": req.payload.patch,
                "timestamp": new Date().getTime()
            };

            // validate patch
            if (typeof bundle.patch == "object" && bundle.patch.hasOwnProperty("a") && bundle.patch.hasOwnProperty("s") && (bundle.patch.a === "+" && bundle.patch.hasOwnProperty("p") || bundle.patch.a === "-" && bundle.patch.hasOwnProperty("f") && bundle.patch.hasOwnProperty("t"))) {

                // calculate offset for incoming patches
                offset = 0;
                for (var rd in revisionDiary) {
                    if (rd >= req.payload.revision) {

                        // single revision diary patch
                        patch = revisionDiary[rd].patch;

                        // some characteres were added in previous revision
                        if (patch.a === "+") {
                            if (bundle.patch.a === "+" && bundle.patch.p >= patch.p) {
                                offset = offset + patch.s.length;
                            }
                            if (bundle.patch.a === "-" && bundle.patch.f >= patch.p) {
                                offset = offset + patch.s.length;
                            }
                        }

                        // some characteres were deleted in previous revision
                        if (patch.a === "-") {
                            if (bundle.patch.a === "+" && bundle.patch.p >= patch.f) {
                                offset = offset - patch.s.length;
                            }
                            if (bundle.patch.a === "-" && bundle.patch.f >= patch.f) {
                                offset = offset - patch.s.length;
                            }
                        }
                    }
                }

                // adding characters
                if (bundle.patch.a === "+") {

                    // take offset into account
                    bundle.patch.p = bundle.patch.p + offset;

                    // update current document
                    currentDocument = currentDocument.substr(0, bundle.patch.p - 1) + bundle.patch.s + currentDocument.substr(bundle.patch.p - 1);
                }

                // deleting characters
                if (bundle.patch.a === "-") {

                    // take offset into account
                    bundle.patch.f = bundle.patch.f + offset;
                    bundle.patch.t = bundle.patch.t + offset;

                    // update patch string just in case
                    bundle.patch.s = currentDocument.substring(bundle.patch.f - 1, bundle.patch.t);

                    // update current document
                    currentDocument = currentDocument.substr(0, bundle.patch.f - 1) + currentDocument.substr(bundle.patch.t);
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