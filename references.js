/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const RE_TYPE_BRACKETS = /<([^>]*)>/;

var parser = require("./parser");

exports.ReferenceData = class {
    constructor() {
        this.synopsis = "";
        this.parameters = [];
        this.returns = new exports.Return("undefined");
    }
};

exports.Parameter = class {
    constructor(identifier, type = "*", description = "", defaultValue = "undefined") {
        this.identifier = identifier;
        this.type = type;
        this.description = description;
        this.defaultValue = defaultValue;
    }
};

exports.Return = class {
    constructor(type = "*", description = "") {
        this.type = type;
        this.description = description;
    }
};

function parseParameter(comment) {
    var newParameter = new exports.Parameter(null);
    
    if ((comment.match(RE_TYPE_BRACKETS) || []).length > 1) {
        var typeString = comment.match(RE_TYPE_BRACKETS)[1].split("=");

        newParameter.type = typeString[0].trim();

        if (typeString.length > 1) {
            newParameter.defaultValue = typeString[1].trim();
        }

        comment = comment.replace(new RegExp(RE_TYPE_BRACKETS, "g"), "");
    }

    var tokens = comment.split(" ");

    if (tokens[0] != "@param") {
        throw new parser.ParseError("Parameter comment has not been declared with `@param`");
    }

    if (tokens.length < 2) {
        throw new parser.ParseError("Parameter comment does not specify identifier");
    }

    newParameter.identifier = tokens[1];

    for (var i = 2; i < tokens.length; i++) {
        newParameter.description += " " + tokens[i];
    }

    newParameter.description = newParameter.description.trim();

    return newParameter;
}

function parseReturn(comment) {
    var newReturn = new exports.Return(null);
    
    if ((comment.match(RE_TYPE_BRACKETS) || []).length > 1) {
        newReturn.type = comment.match(RE_TYPE_BRACKETS)[1];

        comment = comment.replace(new RegExp(RE_TYPE_BRACKETS, "g"), "");
    }

    var tokens = comment.split(" ");

    if (tokens[0] != "@returns") {
        throw new parser.ParseError("Return has not been declared with `@returns`");
    }

    for (var i = 1; i < tokens.length; i++) {
        newReturn.description += " " + tokens[i];
    }

    newReturn.description = newReturn.description.trim();

    return newReturn;
}

exports.getCommentAtIndex = function(index) {
    // TODO: Get block comment instance from its index
    return "dummy";
};

exports.parseComment = function(comment) {
    var commentLines = comment.split("\n").filter((item) => item.trim() != "");
    var indentCount = Math.max(commentLines[0].search(/[\S\t]/), 0);
    var newReferenceData = new exports.ReferenceData();

    console.log(indentCount);

    // For lines that start with an indent, remove that first indent
    commentLines = commentLines.map((item) => new RegExp(`[\\s\\t]{${indentCount},}`).test(item) ? item.slice(indentCount) : item);

    for (var i = 0; i < commentLines.length; i++) {
        if (commentLines[i].startsWith("@param")) {
            newReferenceData.parameters.push(parseParameter(commentLines[i]));
        } else if (commentLines[i].startsWith("@returns")) {
            newReferenceData.returns = parseReturn(commentLines[i]);
        }
    }

    return newReferenceData;
};