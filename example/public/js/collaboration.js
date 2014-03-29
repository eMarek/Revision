/* globals
-------------------------------------------------- */
var xhr = {};
var editor = "textarea[data-revision=editor]";
var editorDocument, patches;
var timeout = 2000;
var lastTimestamp = new Date().getTime() - timeout;

var initialized = false;
var lastRevision = 0;
var waitingChanges = [];
var sentChanges = false;
var currentDocument = "";

/* document ready
-------------------------------------------------- */
$(document).ready(function() {

    function collaboration() {

        // does editor exist on page
        if ($(editor).length) {

            if (initialized) {

                // calculate patches
                editorDocument = $(editor).val();
                patches = changes(currentDocument, editorDocument);
                if (patches[0]) {
                    $("#sidebar").append("<p>" + JSON.stringify(patches) + "</p>");
                    currentDocument = editorDocument;
                    for (var pp in patches) {
                        waitingChanges.push(patches[pp]);
                    }
                }
            }

            // allow collaboration ajax every few seconds
            timestamp = new Date().getTime();
            if (timestamp - lastTimestamp < timeout) {
                return;
            } else {
                lastTimestamp = new Date().getTime();
            }

            // is previous request completed
            if (xhr.collaboration && xhr.collaboration.readyState != 4) {
                return;
            }

            if (!initialized) {

                // editor initialize
                var data = {
                    "initialize": true
                };

            } else if (waitingChanges[0] && !sentChanges) {

                // check if there is any waiting changes and no sent changes
                sentChanges = waitingChanges.shift();
                var data = {
                    "changes": [sentChanges]
                };

            } else {

                // no operation, just checking for changes from other users
                var data = {
                    "changes": []
                };
            }

            // collaboration ajax
            xhr.collaboration = $.ajax({
                url: "api/collaboration.json",
                contentType: 'application/json',
                type: "post",
                data: JSON.stringify(data),
                headers: {
                    Session: window.sessionStorage.session
                },
                dataType: "json",
                success: function(server) {
                    if (server.say === "yay") {

                        // initialized from server
                        if (server.initialize) {
                            console.log("EDITOR INITIALIZED");
                            $(editor).removeAttr("disabled").val(server.currentDocument).focus();
                            initialized = true;
                            lastRevision = server.lastRevision;
                            waitingChanges = [];
                            sentChanges = false;
                            currentDocument = server.currentDocument;
                        }

                        // server acknowledged sent changes
                        if (server.acknowledge) {
                            console.log("ACKNOWLEDGE SENT CHANGES");
                        }

                        // new changes from server
                        if (server.changes) {
                            console.log("NEW CHANGES");
                        }
                    }
                }
            });

        } else {

            // reset collaboration
            if (initialized) {
                initialized = false;
                lastRevision = 0;
                waitingChanges = [];
                sentChanges = false;
                currentDocument = "";
            }
        }
    }

    // recursive calling collaboration
    setInterval(function() {
        collaboration();
    }, 500);
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
                    "l": string.length,
                    "p": i + 1
                });
            } else {
                changes.push({
                    "a": "-",
                    "s": string,
                    "l": string.length,
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
                    "l": string.length,
                    "f": i + 1,
                    "t": i + string.length
                });
            } else {
                changes.push({
                    "a": "+",
                    "s": string,
                    "l": string.length,
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

    // return changes
    return changes;
}

/* forcer
-------------------------------------------------- */
$(document).on("click", "#forcer", function() {

    var $editor = $("textarea[data-revision]");
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