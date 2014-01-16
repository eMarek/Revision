// revision.js

"use strict";

var revisionLog = {};

function addLog(log) {
    revisionLog[Date.now()] = log;
}

var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('What is on your mind? ');
rl.prompt();

rl.on('line', function(line) {

    switch (line.trim()) {
        case 'exit':
            rl.close();
            break;
        case 'log':
            console.log(revisionLog);
            break;
        default:
            addLog(line);
            break;
    }
    rl.prompt();

}).on('close', function() {

    console.log('Have a great day!');
    process.exit(0);

});