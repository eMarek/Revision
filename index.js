// index.js
"use strict";

/*
 *
 * Part 1: Calculate longest common subsequence (LCS), minimum edit distance (MED) and shortest edit script (SES) matrices.
 *
 */

var originalText = "";
var changedText = "";

console.log('"' + originalText + '" > "' + changedText + '"');

var longerText = (originalText.length < changedText.length) ? changedText : originalText;
var shorterText = (originalText.length < changedText.length) ? originalText : changedText;
var delta = longerText.length - shorterText.length;

var LCS = [];
var MED = [];
var SES = [];

var EMPTY = '-';
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
 * Part 2: Display calculated metrices for debugging purposes.
 *
 */

// show table
function showTable(table, longerText, shorterText) {
    var space = "   ";

    // show longer text horizontaly
    var line = space + space;
    var c = "";
    for (var i = 0; i < longerText.length; i++) {
        c = longerText.charAt(i);
        line = line + (space + c).slice(-space.length);
    }
    console.log(line);

    // show shorter text verticaly
    var line = space;
    table.forEach(function(tableRow, i) {
        if (!i) {
            line = space;
        } else {
            c = shorterText.charAt(i - 1);
            line = (space + c).slice(-space.length);
        }

        tableRow.forEach(function(tableCol, j) {
            line = line + (space + tableCol).slice(-space.length);
        })
        console.log(line);
    });
}

// show LCS
// showTable(LCS, longerText, shorterText);


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
var character = '';
var changes = [];
var string = "";
var timestamp = new Date();

// find changes in LCS until the top left field is reached
while (true) {

    // current location
    // console.log('(' + i + ',' + j + ')');

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
        changes.push({
            a: (originalText.length < changedText.length) ? '+' : '-',
            s: string,
            l: string.length,
            p: i + 1,
            f: j + 1,
            t: j + string.length
        });

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
        changes.push({
            a: (originalText.length < changedText.length) ? '-' : '+',
            s: string,
            l: string.length,
            p: j + 1,
            f: i + 1,
            t: i + string.length
        });

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

// show changes
console.log(changes);