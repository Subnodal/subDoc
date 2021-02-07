/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const fs = require("fs");
const path = require("path");

/*
    Get a list of paths to files in a directory.
    @param dir {String} Root path of directory to traverse
    @returns {Object} List of traversed file paths
*/
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

/*
    Get all contents of specified JavaScript files.
    @param files {Object} List of files to extract contents of (may include non-JS files)
    @returns {String} Concatenated contents of all JavaScript files
*/
exports.squash = function(files) {
    var data = "";

    files.forEach(function(file) {
        try {
            if (file == "test.js") {
                data += fs.readFileSync(file) + "\n";
            }
        } catch (e) {}
    });

    return data;
};