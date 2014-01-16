#!/usr/bin/env node

"use strict";

var path = require('path');
var fs = require('fs');
var loc = path.dirname(fs.realpathSync(__filename))

require(loc + '/index.js');