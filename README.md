Revision
========

Revision is fully functional node.js framework with a specialty, that is realtime collaboration tool based on operational transformation. We developed this as a thesis at the end of my study at the Faculty of Computer and Information Science, Ljubljana.

### How to install
```
npm install -g revision
```
Do not forget `-g` command, otherwise it will not work completely.  
Of course you will need node.js and a fluffy unicorn.

### How to use it
Running `revision` module gets you fully operational webserver. Choose a folder on your computer and put this two lines in `/index.js` file.

```js
// index.js
var app = require("revision");
app.run();
```
Start it with node like this `node index.js` and then open you browser on `http://127.0.0.1:8888/`. Voilà!  
You should get `404 Not Found` error and this is so freaking awsome, isn't it?!

There are two things that our module could do really good. It could serve static files and it could provide data over API.

### Serving static files

Create yourself a `/public` folder. Anything in this folder is immediately available in your browser with correct MIME type. By default is loaded `/public/index.html` file. Create it and you will get rid of 404.

### Providing data over API

There is a simple API which could:
* gather request payload
* response with send function

All handlers must be located in `/api` folder and have quite a classic structure. Look at this simple `/api/villain.js` handler.

```js
// api/villain.js

"use strict";

var api = {};

/* api/gru.json
-------------------------------------------------- */
api["gru.json"] = function(req, rsp, data) {

    var stole = req.payload.stole;
    var minions;

    if (stole == "Statue of Liberty") {
        minions = "Cheering!";
    } else if (stole == "Eiffel Tower") {
        minions = "Cheer stop?";
    } else {
        minions = "Don't give a single duck."
    }

    rsp.send({
        "say": "yay",
        "minions": minions
    });
};

module.exports = api;
```

Don't worry. We will explain you. It serves `http://127.0.0.1:8888/api/gru.json` requests. It expects  `stole` request payload. Depending on this variable are `minions` declared. At the end `send` function responds with an obvious JSON.

### What about config

You can use it of course. It is easy peasy to use it. Make a `/config.js` file with following structure.

```js
// config.js

"use strict";

module.exports = function(data, starter) {

    // minions colors example data
    data["minionsColors"] = ["yellow", "purple"];

    // salt and key
    data["salt"] = "DO NOT USE THIS SALT IN PRODUCTION";
    data["key"] = "EITHER THIS KEY";

    starter(data);
};
```

You are probably asking yourself why is `config` usefull. We will show you. Anything you will add to the `data` object will be available in all your API handlers. For example above, we could use `data.minionsColors` in our `gru.json` API. As you can see, any date you would like to be available in every API, you should put it in `config` file. It is very handy for database connections.

Pay attention on `starter(data);` callback!

### What about controller

Controller is used for very similar matter as config file, passing `data` to API handlers. But it has one significant difference. It is executed for every request and not just once as config is. From that perspective is suitable for user authentication. It has following structure.

```js
// controller.js

"use strict";

module.exports = function(req, rsp, data, handler) {

    // does user have session
    if (!req.headers.hasOwnProperty("session")) {
        rsp.send({
            "say": "out",
            "msg": "Login required."
        });
        return;
    }

    // minion type example data
    var eyes  = req.payload.eyes;
    if (eyes == 1) {
        data.minonType = "One-eyed minion!";
    }
    else if (eyes == 2) {
        data.minonType = "Two-eyed minion!";
    }
    else {
        data.minonType = "Unknown minion!";
    }

    handler(req, rsp, data);
};
```

Pay attention on `handler(req, rsp, data);` callback!

### Operational transformation

This was main part of my thesis. Operational transformation itself works both on server and on client side. Server side part is performed in [collaboration.js](https://github.com/eMarek/Revision/blob/master/collaboration.js) file in our module. But the client side is performed in example [collaboration.js](https://github.com/eMarek/Revision/blob/master/example/public/js/collaboration.js) file. Please take a look in example folder. You can test this working example on this url http://diploma.marek.si/.

### Changes
Part of operational transformation is also calculating changes between two texts. Very similar to `google-diff-match-patch`, just a little bit faster. To calculate changes enter original text as first argument and changed text as second argument when calling `revision` from you terminal.
```
revision "Despicable Me" "Despicable Minions"
```
You will get JSON with changes based on original text.
```
[ { a: '-', s: 'e', l: 1, p: 13, f: 13, t: 13 },
  { a: '+', s: 'inions', l: 6, p: 14, f: 13, t: 18 } ]
```
If you do not understand what does this mean, is because it is intended to be so. Take a coffee break and you will figure it out.
