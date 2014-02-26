// index.js

"use strict";

function showTable(table, longerText, shorterText) {
    var space = "   ";

    // longer text
    var line = space + space;
    var c = "";
    for (var i = 0; i < longerText.length; i++) {
        c = longerText.charAt(i);
        line = line + (space + c).slice(-space.length);
    }
    console.log(line);

    // shorter text
    var line = space;
    table.forEach(function(tableRow, i) {

        if (!i) {
            line = space;
        } else {
            c = shorterText.charAt(i - 1);
            line = (space + c).slice(-space.length);
        }

        tableRow.forEach(function(tableCol) {
            if (!tableCol) {
                tableCol = '-';
            }
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

var falses = [];

for (var i = 0; i <= longerText.length; i++) {
    falses.push(false);
}

for (var i = 0; i <= shorterText.length; i++) {
    LCS.push(falses);
    MED.push(falses);
    SES.push(falses);
}

showTable(LCS, longerText, shorterText);