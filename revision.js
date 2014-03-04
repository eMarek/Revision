#!/usr/bin/env node

"use strict";

var changes = require('./changes.js');

var originalText = process.argv[2] || "";
var changedText = process.argv[3] || "";

if (!originalText && !changedText) {
    console.log("To calculate changes please enter original text as first argument and changed text as second argument!");
} else {
    var patches = changes(originalText, changedText);
    console.log(patches);
}