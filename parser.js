/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var syntax = require("./syntax");

exports.Namespace = class {
    cosntructor(identifier) {
        this.identifier = identifier;

        this.fields = [];
    }
}

exports.Parameter = class {
    constructor(identifier, type = "*", description = "", defaultValue = "") {
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

exports.Reference = class {
    constructor(identifier, synopsis = "") {
        this.identifier = identifier;
        this.synopsis = synopsis;
    }
};

exports.FunctionReference = class extends exports.Reference {
    constructor(identifier, synopsis = "", parameters = [], returns = exports.Return("undefined")) {
        super(identifier, synopsis);

        this.parameters = parameters;
        this.returns = returns;
    }
};

exports.ClassReference = class extends exports.FunctionReference {
    constructor(identifier, synopsis = "", parameters = [], returns = exports.Return("undefined")) {
        super(identifier, synopsis, parameters, returns);

        this.fields = [];
    }
};

exports.tokenise = function(input) {
    var tokens = input.split(/\b|\s|(?=(?!\())(?!(?!\)))|(?=(?!{))(?!(?!}))/g); // Split at identifier boundaries, whitespace and brackets

    // Remove whitespace tokens and trim the rest of the tokens
    tokens = tokens
        .filter((item) => !/^\s$/.test(item))
        .map((item) => item.trim())
    ;

    return tokens;
}

function isPatternInUse(pattern, patternApplications) {
    for (var i = 0; i < patternApplications.length; i++) {
        if (patternApplications[i].pattern == pattern) {
            return true;
        }
    }

    return false;
}

exports.getPatternApplicationsFromTokens = function(tokens) {
    var foundPatterns = [];
    var tokenIndex = 0;
    var patternApplications = [];
    var patternApplicationNamespaceStack = [];

    tokens.push(null);

    while (tokenIndex < tokens.length) {
        if (patternApplicationNamespaceStack.length > 0 && patternApplicationNamespaceStack[patternApplicationNamespaceStack.length - 1].pattern.end.token == tokens[tokenIndex]) {
            var poppedPatternApplication = patternApplicationNamespaceStack.pop();

            if (patternApplicationNamespaceStack.length == 0) {
                foundPatterns.push(poppedPatternApplication);
            } else {
                patternApplicationNamespaceStack[patternApplicationNamespaceStack.length - 1].namespacedApplications.push(poppedPatternApplication);
            }

            patternApplications = []; // Cancel pending pattern applications since an end shape has been reached
        }

        // Check for new occurrences of patterns to apply
        for (var i = 0; i < syntax.patterns.length; i++) {
            if (isPatternInUse(syntax.patterns[i], patternApplications)) {
                continue;
            }

            if (syntax.patterns[i].fulfilsAt(tokens[tokenIndex], 0)) {
                patternApplications.push(new syntax.PatternApplication(syntax.patterns[i]));
            }
        }

        var qualifiedPatternApplications = [];

        for (var i = 0; i < patternApplications.length; i++) {
            // Check if pattern application has been successful
            if (patternApplications[i].shapeIndex == patternApplications[i].highestShapeIndex) {
                patternApplicationNamespaceStack.push(patternApplications[i]);

                patternApplications = []; // Cancel pending pattern applications since a successful one has been found
                tokenIndex--;

                continue;
            }

            // Otherwise, qualify pattern application if it's still valid
            if (patternApplications[i].pattern.fulfilsAt(tokens[tokenIndex], patternApplications[i].shapeIndex)) {
                qualifiedPatternApplications.push(patternApplications[i]);

                // Increment shape index if it shouldn't be held back
                // Shape indexes must be held back to read tokens that all satisfy a `shape.TokensUntil` check
                if (!patternApplications[i].pattern.mustHoldBackShapeIndex(tokens[tokenIndex], patternApplications[i].shapeIndex)) {
                    patternApplications[i].shapeIndex++;
                }
            }
        }

        patternApplications = qualifiedPatternApplications;
        tokenIndex++;
    }

    return foundPatterns;
};

exports.parse = function(input) {
    var tokens = exports.tokenise(input);

    return exports.getPatternApplicationsFromTokens(tokens);
};