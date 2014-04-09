/* globals
-------------------------------------------------- */
var editor = "textarea#editor";
var sidebar = "div#sidebar";

var loopInterval = 5000,
    pause = false,
    xhr = {},
    data = false,
    reset = false,
    html, scroll,
    bundle, patch;

var caretStart,
    caretEnd,
    caretOffsetStart,
    caretOffsetEnd;

var revision = -1,
    waitingPetches = [],
    writtenPetches = [],
    clientPetches = [],
    acknowledgedPetches = [],
    oldDocument = "",
    currentDocument = "",
    newDocument = "";

/* collaboration
-------------------------------------------------- */
function collaboration() {

    // recursive calling collaboration
    setTimeout(function() {
        collaboration();
    }, loopInterval);

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

        // calculate waiting patches with changes function if there is non
        if (!waitingPetches[0]) {
            newDocument = $(editor).val();
            waitingPetches = changes(oldDocument, newDocument);
        }

        // sent patch to server if there is any
        if (waitingPetches[0]) {

            // take on petch from waiting patches
            pitch = waitingPetches.shift();

            // sent patch with expected revision number
            data = {
                "patch": pitch,
                "revision": revision
            };

        } else {

            // sent just revision number to the server
            data = {
                "revision": revision
            };
        }

        // reset editor
        if (reset) {
            data = {
                "revision": -2
            }
            reset = false;
        }

        // collaboration ajax
        xhr.collaboration = $.ajax({
            url: "api/collaboration.json",
            contentType: "application/json",
            type: "post",
            data: JSON.stringify(data),
            headers: {
                Session: window.sessionStorage.session
            },
            dataType: "json",
            success: function(server) {

                // handling current document
                if (server.hasOwnProperty("currentDocument")) {

                    // reset collaboration
                    revision = -1;
                    waitingPetches = [];
                    writtenPetches = [];
                    clientPetches = [];
                    acknowledgedPetches = [];
                    oldDocument = "";
                    currentDocument = "";
                    newDocument = "";

                    // initialization
                    oldDocument = server.currentDocument;

                    // empty sidebar, will be filled up in next if
                    $(sidebar).html("");

                    // enable and fill out the textarea with existing document
                    $(editor).removeAttr("disabled").val(oldDocument).focus();

                    // correct caret position at the end of document
                    $(editor)[0].selectionStart = oldDocument.length;
                    $(editor)[0].selectionEnd = oldDocument.length;

                } else if (server.revisionDiary) {

                    // remember acknowledged patches
                    acknowledgedPetches = acknowledgedPetches.concat(server.revisionDiary);

                    // prepare current document from old document
                    currentDocument = oldDocument;

                    // calculate written patches with changes function
                    writtenPetches = changes(newDocument, $(editor).val());

                    // concat waiting patches and written patches because operational transformation needs to be done on all of them
                    clientPetches = waitingPetches.concat(writtenPetches);

                    // prepare caret position for calculating
                    caretStart = $(editor)[0].selectionStart;
                    caretEnd = $(editor)[0].selectionEnd;
                    caretOffsetStart = 0;
                    caretOffsetEnd = 0;

                    // upbuild temporary current document with acknowledged patches
                    for (var lp in acknowledgedPetches) {

                        // single acknowledged patch
                        patch = acknowledgedPetches[lp].patch;

                        // some characteres were added in previous revision
                        if (patch.a === "+") {

                            // update current document
                            currentDocument = currentDocument.substr(0, patch.p - 1) + patch.s + currentDocument.substr(patch.p - 1);
                        }

                        // some characteres were deleted in previous revision
                        if (patch.a === "-") {

                            // update current document
                            currentDocument = currentDocument.substr(0, patch.f - 1) + currentDocument.substr(patch.t);
                        }

                        // correct waiting patches position or from/to values - OPERATIONAL TRANSFORMATION
                        if (acknowledgedPetches[lp].author !== window.sessionStorage.userID) {

                            for (var cp in clientPetches) {

                                // some characteres were added in previous revision
                                if (patch.a === "+") {
                                    if (clientPetches[cp].a === "+" && clientPetches[cp].p >= patch.p) {
                                        clientPetches[cp].p = clientPetches[cp].p + patch.s.length;
                                    }
                                    if (clientPetches[cp].a === "-" && clientPetches[cp].f >= patch.p) {
                                        clientPetches[cp].t = clientPetches[cp].t + patch.s.length;
                                        clientPetches[cp].f = clientPetches[cp].f + patch.s.length;
                                    }
                                }

                                // some characteres were deleted in previous revision
                                if (patch.a === "-") {
                                    if (clientPetches[cp].a === "+" && clientPetches[cp].p >= patch.f) {
                                        clientPetches[cp].p = clientPetches[cp].p - patch.s.length;
                                    }
                                    if (clientPetches[cp].a === "-" && clientPetches[cp].f >= patch.f) {
                                        clientPetches[cp].t = clientPetches[cp].t - patch.s.length;
                                        clientPetches[cp].f = clientPetches[cp].f - patch.s.length;
                                    }
                                }
                            }

                            // caret positioning when characteres were added in previous revision
                            if (patch.a === "+") {
                                if (caretStart >= patch.p) {
                                    caretOffsetStart = caretOffsetStart + patch.s.length;
                                }
                                if (caretEnd >= patch.p) {
                                    caretOffsetEnd = caretOffsetEnd + patch.s.length;
                                }
                            }

                            // caret positioning when characteres were deleted in previous revision
                            if (patch.a === "-") {
                                if (caretStart <= caretEnd) {
                                    // ...----...[..........]..........
                                    if (patch.f <= caretStart && patch.f <= caretEnd && patch.t <= caretStart && patch.t <= caretEnd) {
                                        caretOffsetStart = caretOffsetStart - patch.s.length;
                                        caretOffsetEnd = caretOffsetEnd - patch.s.length;
                                    }
                                    // ........--[--........]..........
                                    if (patch.f <= caretStart && patch.f <= caretEnd && patch.t > caretStart && patch.t <= caretEnd) {
                                        caretOffsetStart = caretOffsetStart - (caretStart - patch.f);
                                        caretOffsetEnd = caretOffsetEnd - patch.s.length;
                                    }
                                    // ..........[...----...]..........
                                    if (patch.f > caretStart && patch.f <= caretEnd && patch.t > caretStart && patch.t <= caretEnd) {
                                        caretOffsetStart = caretOffsetStart;
                                        caretOffsetEnd = caretOffsetEnd - patch.s.length;
                                    }
                                    // ..........[........--]--........
                                    if (patch.f > caretStart && patch.f <= caretEnd && patch.t > caretStart && patch.t > caretEnd) {
                                        caretOffsetStart = caretOffsetStart;
                                        caretOffsetEnd = caretOffsetEnd - (caretEnd - patch.f) - 1;
                                    }
                                    // ..........[..........]...----...
                                    if (patch.f > caretStart && patch.f > caretEnd && patch.t > caretStart && patch.t > caretEnd) {
                                        caretOffsetStart = caretOffsetStart;
                                        caretOffsetEnd = caretOffsetEnd;
                                    }
                                } else {
                                    // ...----...]..........[..........
                                    if (patch.f <= caretEnd && patch.f <= caretStart && patch.t <= caretEnd && patch.t <= caretStart) {
                                        caretOffsetStart = caretOffsetStart - patch.s.length;
                                        caretOffsetEnd = caretOffsetEnd - patch.s.length;
                                    }
                                    // ........--]--........[..........
                                    if (patch.f <= caretEnd && patch.f <= caretStart && patch.t > caretEnd && patch.t <= caretStart) {
                                        caretOffsetStart = caretOffsetStart - patch.s.length;
                                        caretOffsetEnd = caretOffsetEnd - (caretEnd - patch.f);
                                    }
                                    // ..........]...----...[..........
                                    if (patch.f > caretEnd && patch.f <= caretStart && patch.t > caretEnd && patch.t <= caretStart) {
                                        caretOffsetStart = caretOffsetStart - patch.s.length;
                                        caretOffsetEnd = caretOffsetEnd;
                                    }
                                    // ..........]........--[--........
                                    if (patch.f > caretEnd && patch.f <= caretStart && patch.t > caretEnd && patch.t > caretStart) {
                                        caretOffsetStart = caretOffsetStart - (caretEnd - patch.f);
                                        caretOffsetEnd = caretOffsetEnd;
                                    }
                                    // ..........]..........[...----...
                                    if (patch.f > caretEnd && patch.f > caretStart && patch.t > caretEnd && patch.t > caretStart) {
                                        caretOffsetStart = caretOffsetStart;
                                        caretOffsetEnd = caretOffsetEnd;
                                    }
                                }
                            }
                        }
                    }

                    // if all waiting patches were proccessed save current document as old document
                    if (!waitingPetches[0]) {
                        oldDocument = currentDocument;
                        acknowledgedPetches = [];
                    }

                    // upbuild temporary current document with waiting patches
                    for (var cp in clientPetches) {

                        // adding characters
                        if (clientPetches[cp].a === "+") {

                            // update current document
                            currentDocument = currentDocument.substr(0, clientPetches[cp].p - 1) + clientPetches[cp].s + currentDocument.substr(clientPetches[cp].p - 1);
                        }

                        // deleting characters
                        if (clientPetches[cp].a === "-") {

                            // update patch string just in case
                            clientPetches[cp].s = currentDocument.substring(clientPetches[cp].f - 1, clientPetches[cp].t);

                            // update current document
                            currentDocument = currentDocument.substr(0, clientPetches[cp].f - 1) + currentDocument.substr(clientPetches[cp].t);
                        }
                    }

                    // put current document into the editor
                    $(editor).val(currentDocument);

                    // correct caret position with offset
                    $(editor)[0].selectionStart = caretStart + caretOffsetStart;
                    $(editor)[0].selectionEnd = caretEnd + caretOffsetEnd;
                }

                // revision
                revision = server.revision;

                // show revision diary in sidebar
                if (server.revisionDiary) {

                    html = "";

                    // prepare html layout for revision diary on sidebar
                    for (var rd in server.revisionDiary) {

                        // single revision diary bundle
                        bundle = server.revisionDiary[rd];

                        // prepare html bundle wrapper with avatar
                        html = html + '<div class="bundle"><i class="avatar" style="background-image:url(../avatars/' + bundle.author + '.jpg);"></i>';

                        // some characteres were added in this particular revision
                        if (bundle.patch.a === "+") {
                            html = html + '<span class="added"><pre class="string">' + bundle.patch.s.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre><span class="location">' + bundle.patch.p + '</span></span>';
                        }

                        // some characteres were deleted in this particular revision
                        if (bundle.patch.a === "-") {
                            html = html + '<span class="deleted"><pre class="string">' + bundle.patch.s.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre><span class="location">' + bundle.patch.f + ' - ' + bundle.patch.t + '</span></span>';
                        }

                        // end html bundle wrapper
                        html = html + '</div>';
                    }

                    // check scrolling
                    scroll = ($(sidebar)[0].scrollHeight - $(sidebar).scrollTop() - $(sidebar).outerHeight() < 200) ? true : false;

                    // append to sidebar
                    $(sidebar).append(html);

                    // scroll
                    if (scroll) {
                        $(sidebar).animate({
                            scrollTop: $(sidebar)[0].scrollHeight
                        }, 500);
                    }
                }
            }
        });

    } else {

        // reset collaboration
        revision = -1;
        waitingPetches = [];
        writtenPetches = [];
        clientPetches = [];
        acknowledgedPetches = [];
        oldDocument = "";
        currentDocument = "";
        newDocument = "";
    }
}

/* init collaboration
-------------------------------------------------- */
collaboration();

/* changes
-------------------------------------------------- */
function changes(originalText, changedText) {

    originalText = originalText || "";
    changedText = changedText || "";

    // precheck
    if (originalText === changedText) {
        return [];
    }

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
        $(sidebar).hide();
        $("#container").css("width", "100%");
        $(this).text("Show sidebar");
    } else {
        $(sidebar).show();
        $("#container").css("width", "65%");
        $(this).text("Hide sidebar");
    }
});

/* pauser
-------------------------------------------------- */
$(document).on("click", "#reset", function() {

    // set flag
    reset = true;

    // reset collaboration
    revision = -1;
    waitingPetches = [];
    writtenPetches = [];
    clientPetches = [];
    acknowledgedPetches = [];
    oldDocument = "";
    currentDocument = "";
    newDocument = "";

    // empty sidebar, will be filled up in next if
    $(sidebar).html("");

    // disable and empty textarea
    $(editor).val("").attr("disabled", "disabled");
});