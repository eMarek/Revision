Revision
========

Realtime collaboration tool.

### What can I do with it
Right now is still in alpha version. You can calculate changes between two text. Very similar to `google-diff-match-patch`, just a little bit faster.

### How to install
```
npm install -g revision
```
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
