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
var generator = require("./generator");

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
config.data.excludePaths = config.data.excludePaths || [];

tree.clean(config.data.outdir);

var code = tree.squash(tree.walk(config.data.indir, [...config.data.excludePaths, config.data.outdir]));
var namespaces = parser.parse(code);

generator.createMarkdownFiles(config.data.outdir, namespaces);