// index.js
"use strict";

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

var longerText = "Letalonosilka";
var shorterText = "Ledolomilec";
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
var p = -1;

var shorterChar, longerChar, matchingChar;
var tempUpperLeft, tempUpper, tempLeft;
var tempK, tempV, tempP;

// fill the tables until the bottom right field is reached
while (LCS[shorterText.length][longerText.length] == EMPTY) {

    // increase P-value
    p++;

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
            } else if (j == 0) {
                // zero col fileds

                LCS[i][j] = 0;
                MED[i][j] = i;
                SES[i][j] = i;

            } else {
                // other fields in tables

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
                    tempLeft = LCS[i - 1][j];
                    tempUpper = LCS[i][j - 1];
                    LCS[i][j] = (tempLeft > tempUpper) ? tempLeft : tempUpper;
                }

                // MED
                tempUpperLeft = MED[i - 1][j - 1];
                tempUpperLeft = (matchingChar) ? tempUpperLeft : tempUpperLeft + 2;
                tempLeft = MED[i - 1][j] + 1;
                tempUpper = MED[i][j - 1] + 1;
                // minimum from this three values
                MED[i][j] = Math.min(tempUpperLeft, tempLeft, tempUpper);

                // SES
                tempK = j - i;
                tempV = (MED[i][j] - tempK) / 2;
                tempP = (tempK > delta) ? tempV + (tempK - delta) : tempV;
                SES[i][j] = tempP;
            }
        }
    }

    // end algorithm after 3 seconds
    var timediff = (new Date() - timestamp) / 1000;
    if (timediff > 0.02) {
        break;
    }
}

// show table
showTable(SES, longerText, shorterText);