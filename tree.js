/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const fs = require("fs");
const path = require("path");

/*
    @name tree.walk
    Get a list of paths to files in a directory.
    @param dir <String> Root path of directory to traverse
    @returns <[String]> List of traversed file paths
*/
exports.walk = function(dir, excludePaths = [], treeResults = []) {
    var dirResults = fs.readdirSync(dir);

    dirResults.forEach(function(result) {
        var shouldSkip = false;

        excludePaths.forEach(function(exclusion) {
            if (path.join(dir, result).startsWith(path.join(...exclusion.split(/\/|\\/g)))) {
                shouldSkip = true;
            }
        });

        if (shouldSkip) {
            return;
        }

        try {
            if (fs.statSync(path.join(dir, result)).isDirectory()) {
                treeResults = exports.walk(path.join(dir, result), excludePaths, treeResults);
            } else {
                treeResults.push(path.join(dir, result));
            }
        } catch (e) {}
    });

    return treeResults;
};

/*
    @name tree.clean
    Delete directory and its contents if it doesn't exist.
    @param dir <String> Directory to delete
*/
exports.clean = function(dir) {
    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, {recursive: true});
    }
};

/*
    @name tree.squash
    Get all contents of specified JavaScript files.
    @param files <[String]> List of files to extract contents of (may include non-JS files)
    @returns <String> Concatenated contents of all JavaScript files
*/
exports.squash = function(files) {
    var data = "";

    files.forEach(function(file) {
        try {
            if (file.endsWith(".js")) {
                data += fs.readFileSync(file) + "\n";
            }
        } catch (e) {}
    });

    return data;
};