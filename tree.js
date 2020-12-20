/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const fs = require("fs");
const path = require("path");

exports.walk = function(dir, treeResults = []) {
    var dirResults = fs.readdirSync(dir);

    dirResults.forEach(function(result) {
        try {
            if (fs.statSync(path.join(dir, result)).isDirectory()) {
                treeResults = exports.walk(path.join(dir, result), treeResults);
            } else {
                treeResults.push(path.join(dir, result));
            }
        } catch (e) {}
    });

    return treeResults;
};