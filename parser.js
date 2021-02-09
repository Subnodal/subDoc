/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var references = require("./references");

const RE_NAMESPACE = /namespace\("(.*?)",\s*function\s*\(.*?\)\s*{(.*?)}\)/;
const RE_COMMENT = /\/\*(.*?)\*\//;

exports.ParseError = class extends Error {}

exports.Namespace = class {
    constructor(name, code) {
        this.name = name; // Leave blank for global scope
        this.references = [];

        this.buildReferences(code);
    }

    buildReferences(code) {
        this.references = [];

        var regex = new RegExp(RE_COMMENT, "gs");
        var result;

        while ((result = regex.exec(code)) != null) {
            if (result[1].match(/@name\s+/)) {
                this.references.push(references.parseComment(result[1]));
            }
        }
    }
};

/*
    @name parser.parse
    Parse all supplied code and return namespaces containing references.
    @param input {String} Input code to parse
    @returns {Object} List containing `parser.Namespace` instances
*/
exports.parse = function(input) {
    var regex = new RegExp(RE_NAMESPACE, "gs");
    var result;
    var namespaces = [];

    while ((result = regex.exec(input)) != null) {
        namespaces.push(new exports.Namespace(result[1], result[2]));
    }

    input = input.replace(new RegExp(RE_NAMESPACE, "gs"), input);

    namespaces.push(new exports.Namespace("", input));

    return namespaces;
};