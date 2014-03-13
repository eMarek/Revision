// controller.js

"use strict";

var r = require('rethinkdb');

module.exports = function(request, response, data, handler) {

    data['goal'] = "Operational Transformation";

    handler(request, response, data);
};