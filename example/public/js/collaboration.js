/* globals
-------------------------------------------------- */
var editor = "textarea[data-revision=editor]";

var loopInterval = 1000,
    pause = false,
    xhr = {},
    data = false,
    editorDocument, patches, patch, patchString;

var initialized = false,
    revision = 0,
    sentPatches = false,
    currentDocument = "";

/* document ready
-------------------------------------------------- */
$(document).ready(function() {

    function collaboration() {

        // does editor exist on page
        if ($(editor).length) {

            // pause
            if (pause) {
                return;
            }

            // is previous request completed
            if (xhr.collaboration && xhr.collaboration.readyState != 4) {
                return;
            }

            // prepare date
            data = false;

            if (!initialized) {

                // editor initializing if not jet
                data = JSON.stringify({
                    "initialize": true
                });

            } else if (!sentPatches) {

                // calculate patches with changes function
                editorDocument = $(editor).val();
                patches = changes(currentDocument, editorDocument);

                // sent patches to server
                if (patches[0]) {

                    var prepareSentPatchs = '<div class="bundle"><i class="avatar" style="background-image:url(../avatars/' + window.sessionStorage.userID + '.jpg);"></i>';
                    for (var pc in patches) {
                        patch = patches[pc];
                        if (patch.a === "+") {
                            prepareSentPatchs = prepareSentPatchs + '<span class="added"><pre class="string">' + patch.s.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre><span class="location">' + patch.p + '</span></span>';
                        }
                        if (patch.a === "-") {
                            prepareSentPatchs = prepareSentPatchs + '<span class="deleted"><pre class="string">' + patch.s.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre><span class="location">' + patch.f + ' - ' + patch.t + '</span></span>';
                        }
                    }
                    prepareSentPatchs = prepareSentPatchs + '</div>';

                    $("#sidebar").append(prepareSentPatchs).animate({
                        scrollTop: $("#sidebar")[0].scrollHeight
                    }, 1000);

                    // remember current document
                    currentDocument = editorDocument;

                    // remember sent patches
                    sentPatches = patches;

                    // sent patches to server
                    data = JSON.stringify({
                        "patches": patches,
                        "revision": revision,
                        "timestamp": new Date().getTime()
                    });
                }
            }

            // collaboration ajax
            xhr.collaboration = $.ajax({
                url: "api/collaboration.json",
                contentType: "application/json",
                type: "post",
                data: data,
                headers: {
                    Session: window.sessionStorage.session
                },
                dataType: "json",
                success: function(server) {
                    if (server.say === "yay") {

                        // initialized from server
                        if (server.initialize) {

                            // fill current document
                            $(editor).removeAttr("disabled").val(server.currentDocument).focus();

                            // print out revision diary
                            // ...


                            // caret position
                            $(editor)[0].selectionStart = server.currentDocument.length;
                            $(editor)[0].selectionEnd = server.currentDocument.length;

                            // data
                            initialized = true;
                            revision = server.revisionDiary.length;
                            sentPatches = false;
                            currentDocument = server.currentDocument;
                        }

                        // new patches from server
                        if (server.patches && server.patches[0]) {

                            // process bundle of patches
                            for (var rp in server.patches) {

                                // single patch in server patches
                                patch = server.patches[rp];

                                // validate patch
                                if (typeof patch == "object" && patch.hasOwnProperty("a") && patch.hasOwnProperty("s") && (patch.a === "+" && patch.hasOwnProperty("p") || patch.a === "-" && patch.hasOwnProperty("f") && patch.hasOwnProperty("t"))) {

                                    // adding characters
                                    if (patch.a === "+") {

                                        for (var sp in sentPatches) {
                                            sPatch = sentPatches[sp];
                                            if (sPatch.a === "+" && sPatch.p >= patch.p) {
                                                sPatch.p = sPatch.p + patch.s.length;
                                            }
                                            if (sPatch.a === "-" && sPatch.f >= patch.p) {
                                                sPatch.f = sPatch.f + patch.s.length;
                                                sPatch.t = sPatch.t + patch.s.length;
                                            }
                                        }

                                        // update current document
                                        currentDocument = currentDocument.substr(0, patch.p - 1) + patch.s + currentDocument.substr(patch.p - 1);
                                    }

                                    // deleting characters
                                    if (patch.a === "-") {

                                        for (var sp in sentPatches) {
                                            sPatch = sentPatches[sp];
                                            if (sPatch.a === "+" && sPatch.p >= patch.p) {
                                                sPatch.p = sPatch.p - patch.s.length;
                                            }
                                            if (sPatch.a === "-" && sPatch.f >= patch.p) {
                                                sPatch.f = sPatch.f - patch.s.length;
                                                sPatch.t = sPatch.t - patch.s.length;
                                            }
                                        }

                                        // update current document
                                        currentDocument = currentDocument.substr(0, patch.f - 1) + currentDocument.substr(patch.t);
                                    }

                                    // save current document into editor
                                    $(editor).val(currentDocument);
                                }
                            }

                            // update revision value
                            revision = server.revision;
                        }


                        // server acknowledged sent patches
                        if (server.acknowledge) {

                            // clear sent patches
                            sentPatches = false;

                            // update revision value
                            revision = server.revision;
                        }
                    }
                }
            });

        } else {

            // reset collaboration
            if (initialized) {
                initialized = false,
                revision = 0,
                sentPatches = false,
                currentDocument = "";
            }
        }
    }

    // recursive calling collaboration
    setInterval(function() {
        collaboration();
    }, loopInterval);
});

/* changes
-------------------------------------------------- */
function changes(originalText, changedText) {

    originalText = originalText || "";
    changedText = changedText || "";

    /*
     *
     * Part 1: Calculate longest common subsequence (LCS), minimum edit distance (MED) and shortest edit script (SES) matrices.
     *
     */

    var longerText = (originalText.length < changedText.length) ? changedText : originalText;
    var shorterText = (originalText.length < changedText.length) ? originalText : changedText;
    var delta = longerText.length - shorterText.length;

    var LCS = [];
    var MED = [];
    var SES = [];

    var EMPTY = "-";
    var empties = [];

    for (var i = 0; i <= longerText.length; i++) {
        empties.push(EMPTY);
    }

    for (var i = 0; i <= shorterText.length; i++) {
        LCS.push(empties.slice());
        MED.push(empties.slice());
        SES.push(empties.slice());
    }

    var timestamp = new Date();

    var wantedValueP = -1;
    var diagonalsValueP = {};
    var tempDiagonal, diagonalValueP;

    var shorterChar, longerChar, matchingChar;
    var tempUpperLeft, tempUpper, tempLeft;
    var tempV, tempP;

    // fill the tables until the bottom right field is reached
    while (LCS[shorterText.length][longerText.length] == EMPTY) {

        // increase P-value
        wantedValueP++;

        // filling the tables as far as the P-value said
        for (var i = 0; i <= shorterText.length; i++) {
            for (var j = 0; j <= longerText.length; j++) {

                // skip fields if they are not empty
                if (LCS[i][j] != EMPTY && MED[i][j] != EMPTY && SES[i][j] != EMPTY) {
                    continue;
                }

                if (i == 0) {
                    // zero row fields

                    LCS[i][j] = 0;
                    MED[i][j] = j;
                    SES[i][j] = (j > delta) ? j - delta : 0;

                    diagonalsValueP[j] = (j > delta) ? j - delta : 0;

                } else if (j == 0) {
                    // zero col fileds

                    LCS[i][j] = 0;
                    MED[i][j] = i;
                    SES[i][j] = i;

                    diagonalsValueP[-i] = i;

                } else {
                    // other fields in tables

                    // checking the diagonal
                    tempDiagonal = j - i;
                    diagonalValueP = diagonalsValueP[tempDiagonal];

                    if (diagonalValueP > wantedValueP) {
                        continue;
                    }

                    // chars
                    shorterChar = shorterText.charAt(i - 1);
                    longerChar = longerText.charAt(j - 1);
                    matchingChar = shorterChar === longerChar;

                    // LCS
                    if (matchingChar) {
                        // for one greater than the upper left
                        tempUpperLeft = LCS[i - 1][j - 1];
                        LCS[i][j] = tempUpperLeft + 1;
                    } else {
                        // greater from upper or left
                        tempLeft = LCS[i][j - 1];
                        tempLeft = (tempLeft == EMPTY) ? 0 : tempLeft;
                        tempUpper = LCS[i - 1][j];
                        tempUpper = (tempUpper == EMPTY) ? 0 : tempUpper;
                        LCS[i][j] = Math.max(tempLeft, tempUpper);
                    }

                    // MED
                    tempUpperLeft = MED[i - 1][j - 1];
                    tempUpperLeft = (matchingChar) ? tempUpperLeft : tempUpperLeft + 2;
                    tempLeft = MED[i][j - 1];
                    tempLeft = (tempLeft == EMPTY) ? Number.MAX_VALUE : tempLeft + 1;
                    tempUpper = MED[i - 1][j];
                    tempUpper = (tempUpper == EMPTY) ? Number.MAX_VALUE : tempUpper + 1;
                    MED[i][j] = Math.min(tempUpperLeft, tempLeft, tempUpper);

                    // SES
                    tempV = (MED[i][j] - tempDiagonal) / 2;
                    tempP = (tempDiagonal > delta) ? tempV + (tempDiagonal - delta) : tempV;
                    SES[i][j] = tempP;

                    // correct diagonal max P-value and reset current fields
                    if (tempP > wantedValueP) {
                        diagonalsValueP[tempDiagonal] = tempP;

                        LCS[i][j] = EMPTY;
                        MED[i][j] = EMPTY;
                        SES[i][j] = EMPTY;
                    }
                }
            }
        }

        // end algorithm after 3 seconds
        var timediff = (new Date() - timestamp) / 1000;
        if (timediff > 1) {
            break;
        }
    }

    /*
     *
     * Part 3: Find a snake from start to finish and return adequate changes.
     *
     */

    var i = shorterText.length;
    var j = longerText.length;
    var leftMove = false;
    var upMove = false;
    var currentLCS, nextLCS;
    var character = "";
    var changes = [];
    var string = "";
    var timestamp = new Date();
    var change = {};
    var offset = 0;

    // find changes in LCS until the top left field is reached
    while (true) {

        // current LCS value
        currentLCS = LCS[i][j];

        // try go left
        if (j) {
            nextLCS = LCS[i][j - 1];
            if (nextLCS == currentLCS) {
                j--;
                character = longerText.charAt(j);
                string = character + string;
                leftMove = true;
                continue;
            }
        }

        if (leftMove) {
            if (originalText.length < changedText.length) {
                changes.push({
                    "a": "+",
                    "s": string,
                    "p": i + 1
                });
            } else {
                changes.push({
                    "a": "-",
                    "s": string,
                    "f": j + 1,
                    "t": j + string.length
                });
            }

            string = "";
            leftMove = false;
        }

        // try go up
        if (i) {
            nextLCS = LCS[i - 1][j];
            if (nextLCS == currentLCS) {
                i--;
                character = shorterText.charAt(i);
                string = character + string;
                upMove = true;
                continue;
            }
        }

        if (upMove) {
            if (originalText.length < changedText.length) {
                changes.push({
                    "a": "-",
                    "s": string,
                    "f": i + 1,
                    "t": i + string.length
                });
            } else {
                changes.push({
                    "a": "+",
                    "s": string,
                    "p": j + 1
                });
            }

            string = "";
            upMove = false;
        }

        // try go upper left
        if (i && j) {
            nextLCS = LCS[i - 1][j - 1];
            if (nextLCS == currentLCS - 1) {
                i--;
                j--;
                continue;
            }
        } else {
            // we are in starting location
            break;
        }

        // end algorithm after 3 seconds
        var timediff = (new Date() - timestamp) / 1000;
        if (timediff > 1) {
            break;
        }
    }

    // reverse changes
    changes.reverse();

    // fix position value and from/to values
    for (var cc in changes) {
        change = changes[cc];

        // adding characters
        if (change.a === "+") {

            change.p = change.p + offset;
            offset = offset + change.s.length;
        }

        // deleting characters
        if (change.a === "-") {

            change.f = change.f + offset;
            change.t = change.t + offset;
            offset = offset - change.s.length;
        }
    }

    // return changes
    return changes;
}

/* forcer
-------------------------------------------------- */
$(document).on("click", "#forcer", function() {

    var $editor = $(editor);
    if ($editor.length) {

        setTimeout(function() {
            var start = $editor[0].selectionStart;
            var end = $editor[0].selectionEnd;

            var text = $editor.val();
            $editor.val(text + " BLJEH?!");

            $editor[0].selectionStart = start;
            $editor[0].selectionEnd = end;

        }, 2000);
    }
});

/* pauser
-------------------------------------------------- */
$(document).on("click", "#pauser", function() {

    if (pause) {
        pause = false;
        $(this).text("Pause collaboration");
    } else {
        pause = true;
        $(this).text("Continue collaboration");
    }
});

/* sider
-------------------------------------------------- */
$(document).on("click", "#sider", function() {

    var sidebarAction = $(this).text();

    if (sidebarAction === "Hide sidebar") {
        $("#sidebar").hide();
        $("#container").css("width", "100%");
        $(this).text("Show sidebar");
    } else {
        $("#sidebar").show();
        $("#container").css("width", "65%");
        $(this).text("Hide sidebar");
    }
});