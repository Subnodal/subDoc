/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const RE_TYPE_BRACKETS = /<([^>]*)>/;

var parser = require("./parser");

/*
    @name references.Reference
    @type class
    Reference object containing documentable information about a code entity.
*/
/*
    @name references.Reference.name
    @type prop <null | String>
    Identifier or reference chain of code entity
*/
/*
    @name references.Reference.type
    @type prop <String>
    The type of code entity that is being referenced.
        ~~~~
        First word (item delimited by space) be any of:
        * `"function"` for a function (defined by `function` keyword)
        * `"class"` for a class (defined by `class` keyword), `"extends"` can be
          concatenated after a space to represent a class extension
        * `"method"` for a class method
        * `"static"` for a static class method (defined by `static` keyword)
        * `"prop"` for a class property (typically referenced as
          `this.propName`)
        * `"const"` for a constant variable (defined by `const` keyword)
        * `"var"` for a variable (typically defined by `var` keyword)
        * `"generator"` for a generator function (defined by `function*` syntax)
        ~~~~
        May also be anything else, but this is discouraged. If the type is a
        `"prop"`, `"const"` or `"var"`, the type's datatype annotation can also
        be concatenated after a space.
*/
/*
    @name references.Reference.synopsis
    @type prop <String>
    The synopsis describing code entity.
        Leave this blank if there is no synopsis.
*/
/*
    @name references.Reference.parameters
    @type prop <[references.Parameter]>
    A list of parameter references that code entity takes, if any.
*/
/*
    @name references.Reference.returns
    @type class <references.Return>
    A return object that code entity gives, if any.
*/
exports.Reference = class {
    constructor() {
        this.name = null;
        this.type = "function";
        this.synopsis = "";
        this.parameters = [];
        this.returns = new exports.Return("undefined");
    }
};

/*
    @name references.Parameter
    @type class
    A reference to a parameter that is part of a code entity.
    @param identifier <String> The identifier of the parameter
    @param type <String = "*"> The datatype that a value should be of when used as an argument for this parameter
    @param description <String = ""> A description of the parameter. Leave blank if there's no description
    @param defaultValue <String = "undefined"> The default value the parameter will be if there is no matching argument specified
*/
/*
    @name references.Parameter.identifier
    @type prop <String>
*/
/*
    @name references.Parameter.type
    @type prop <String>
*/
/*
    @name references.Parameter.description
    @type prop <String>
*/
/*
    @name references.Parameter.defaultValue
    @type prop <String>
*/
exports.Parameter = class {
    constructor(identifier, type = "*", description = "", defaultValue = "undefined") {
        this.identifier = identifier;
        this.type = type;
        this.description = description;
        this.defaultValue = defaultValue;
    }
};

/*
    @name references.Return
    @type class
    A reference to a value that a code entity returns.
    @param type <String = "undefined"> The datatype of the value that is returned
    @param description <String = ""> A description of the return. Leave blank if there's no description
*/
/*
    @name references.Return.type
    @type prop <String>
*/
/*
    @name references.Return.description
    @type prop <String>
*/
exports.Return = class {
    constructor(type = "undefined", description = "") {
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

/*
    @name references.parseComment
    Parse a comment's type annotations to generate a code reference.
    @param comment <String> Contents of comment to parse, excluding opening and closing comment syntax
    @returns <references.Reference> The generated code reference instance
*/
exports.parseComment = function(comment) {
    var commentLines = comment.split("\n").filter((item) => item.trim() != "");
    var indentCount = Math.max(commentLines[0].search(/[\S\t]/), 0);
    var newReferenceData = new exports.Reference();

    // For lines that start with an indent, remove that first indent
    commentLines = commentLines.map((item) => new RegExp(`[\\s\\t]{${indentCount},}`).test(item) ? item.slice(indentCount) : item);

    for (var i = 0; i < commentLines.length; i++) {
        if (commentLines[i].startsWith("@name")) {
            newReferenceData.name = commentLines[i].split(" ").slice(1).join(" ");
        } else if (commentLines[i].startsWith("@type")) {
            newReferenceData.type = commentLines[i].split(" ").slice(1).join(" ");
        } else if (commentLines[i].startsWith("@param")) {
            newReferenceData.parameters.push(parseParameter(commentLines[i]));
        } else if (commentLines[i].startsWith("@returns")) {
            newReferenceData.returns = parseReturn(commentLines[i]);
        } else {
            newReferenceData.synopsis += " " + commentLines[i];
        }
    }

    newReferenceData.synopsis = newReferenceData.synopsis.replace(new RegExp(" ".repeat(5), "g"), "\n").replace(/~~~~/g, "\n").trim();

    return newReferenceData;
};