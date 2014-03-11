Revision
========

Realtime collaboration tool.

### What can I do with it
Right now is still in alpha version. You can calculate changes between two text. Very similar to `google-diff-match-patch`, just a little bit faster.

### How to install
```
npm install -g revision
```
Do not forget `-g` command, otherwise it will not work.  
Of course you will need node.js and a fluffy unicorn.

### How to use it
To calculate changes enter original text as first argument and changed text as second argument when calling revision!
```
revision "Despicable Me" "Despicable Minions"
```
You will get JSON with changes based on original text.
```
[ { a: '-', s: 'e', l: 1, p: 13, f: 13, t: 13 },
  { a: '+', s: 'inions', l: 6, p: 14, f: 13, t: 18 } ]
```
If you do not understand what does this mean, is because it is intended to be so. Take a coffee break and you will figure it out.

### Wait what no way
All this above is just a little piece of entire module. Yeah I am still developing it. But you can test it.  
Starting server requires `revision` module.
```js
// index.js
var app = require("revision");
app.run();
```

Module can serve static files in `/public` folder with correct MIME type.  
File `/public/index.html` will be loaded by default.

There is also simple API which can gather request payload and response with send function.  
All handlers must be located in `/api` folder.
```js
// api/villain.js

"use strict";
var api = {};

/* api/gru.json
-------------------------------------------------- */
api["gru.json"] = function(request, response) {

    var stole = request.payload.stole;
    var minions;

    if (stole == "Statue of Liberty") {
        minions = "Cheering!";
    } else if (stole == "Eiffel Tower") {
        minions = "Cheer stop?";
    } else {
        minions = "Don't give a single duck."
    }

    response.send({
        status: "okay",
        minions: minions
    });
};

module.exports = api;
```

Take a look in the example folder and give me some feedback.
