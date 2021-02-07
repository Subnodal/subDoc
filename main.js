#!/usr/bin/env node

/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const yargs = require("yargs");
const path = require("path");

var config = require("./config");
var tree = require("./tree");
var parser = require("./parser");

const options = yargs
    .usage("Usage: $0 [-i indir] [-o outdir] [-c configfile]")
    .option("i", {
        type: "string",
        alias: "indir",
        describe: "Input directory to scan for .js files (can be parent of output directory)"
    })
    .option("o", {
        type: "string",
        alias: "outdir",
        describe: "Output directory to place resulting Markdown reference documentation files, overrides config file"
    })
    .option("c", {
        type: "string",
        alias: "configfile",
        describe: "Location of config file to use; subdoc.json in the root of the input directory will otherwise be used"
    })
    .argv
;

if (options.indir) {
    config.data.indir = options.indir;
}

config.init();

config.data.indir = options.indir || config.data.indir || ".";
config.data.outdir = options.outdir || config.data.outdir || path.join(config.data.indir, "docs");

console.log(tree.walk(config.data.indir));
// console.log(parser.parse("function integerTest(a, b, c) {constructor(a) {test() {e}}} function integerTest(a, b, c) {} function integerTest(a, b, c) {}"));
// console.log(parser.parse(`exports.test = function(a) {exports.test = "hi";});`));
// console.log(parser.parse(`namespace("com.subnodal.subdoc", function(exports) {a /* test */ function integerTest(a, b, c) {a}});`));
// console.log(parser.parse(`/* test */ function integerTest(a, b, c) {a}`));

console.log(parser.parse(`
    /*
        comment
    */
    class Test {
        constructor() {}

        /*
            does stuff
        */
        another() {}
    }

    /*
        Literally returns true no matter what.
        @param a {*} A random value
        @param b {Number = 5} Just a number
        @param c {String | null} Some bit of text or something
        @returns {Boolean} Whether the function is good or not
    */
    function testing(a, b = 5, c) {
        return true;
    }

    /*
        Hello
    */
    namespace("test", function(exports) {
        /*
            hi there
        */
        exports.hello = function() {
            hi;
        };
    }

    /*
       Just another block.
    */
    function somethingElse() {
        return true;
    }
`));

console.log(parser.parse(tree.squash(tree.walk(config.data.indir))));
debugger;