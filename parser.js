/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var syntax = require("./syntax");
var references = require("./references");

exports.ParseError = class extends Error {}

exports.Namespace = class {
    constructor(identifier) {
        this.identifier = identifier;

        this.fields = [];
    }
}

exports.Reference = class {
    constructor(identifier, synopsis = "") {
        this.identifier = identifier;
        this.synopsis = synopsis;
    }
};

exports.FunctionReference = class extends exports.Reference {
    constructor(identifier, synopsis = "", parameters = [], returns = new references.Return("undefined")) {
        super(identifier, synopsis);

        this.parameters = parameters;
        this.returns = returns;
    }
};

exports.ClassReference = class extends exports.FunctionReference {
    constructor(identifier, synopsis = "", parameters = [], returns = new references.Return("undefined")) {
        super(identifier, synopsis, parameters, returns);

        this.fields = [];
    }
};

exports.tokenise = function(input) {
    var tokens = input.split(/\b|\s|(?=(?!\())(?!(?!\)))|(?=(?!{))(?!(?!}))|(?=["'`:;,])/g); // Split at identifier boundaries, whitespace, brackets, quotes and delimiters

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

function shouldCancelAcceptablePatternApplication(patternApplications, patternApplicationIndex, nextToken) {
    for (var i = 0; i < patternApplicationIndex; i++) {
        if (patternApplications[i].pattern.fulfilsAt(nextToken, patternApplications[i].shapeIndex)) {
            return true;
        }
    }

    return false;
}

function shouldAcceptPatternApplication(patternApplications, patternApplicationIndex) {
    return patternApplications[patternApplicationIndex].shapeIndex + 1 == patternApplications[patternApplicationIndex].pattern.shape.length;
}

exports.getPatternApplicationsFromTokens = function(tokens) {
    var foundPatterns = [];
    var tokenIndex = 0;
    var patternApplications = [];
    var patternApplicationNamespaceStack = [];

    tokens.push(null);

    while (tokenIndex <= tokens.length) {
        if (patternApplicationNamespaceStack.length > 0 && (
            patternApplicationNamespaceStack[patternApplicationNamespaceStack.length - 1].pattern.end.token == tokens[tokenIndex] ||
            tokens[tokenIndex] == null
        )) {
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

            if (new syntax.patterns[i]().fulfilsAt(tokens[tokenIndex], 0)) {
                patternApplications.push(new syntax.PatternApplication(new syntax.patterns[i]()));
            }
        }

        var qualifiedPatternApplications = [];

        for (var i = 0; i < patternApplications.length; i++) {
            // Check if pattern application has been successful
            if (shouldAcceptPatternApplication(patternApplications, i)) {
                patternApplications[i].pattern.fulfilsAt(tokens[tokenIndex], patternApplications[i].shapeIndex); // Call again to ensure that duplicate value prevention has been updated

                // Check if there are competing pattern applications that are more likely to be successful
                // If so, cancel this pattern application
                if (shouldCancelAcceptablePatternApplication(patternApplications, i, tokens[tokenIndex + 1])) {
                    continue;
                }

                patternApplicationNamespaceStack.push(patternApplications[i]);

                patternApplications = []; // Cancel pending pattern applications since a successful one has been found

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

exports.getReferencesFromPatternApplications = function(patternApplications, input, referenceCommentIndex = 0) {
    var foundReferences = [];
    var referenceDataCued = null;

    for (var i = 0; i < patternApplications.length; i++) {
        if (patternApplications[i].pattern instanceof syntax.BlockCommentPattern) {
            referenceCommentIndex++;
            referenceDataCued = references.parseComment(references.getCommentAtIndex(input, referenceCommentIndex));

            continue;
        }

        if (referenceDataCued != null) {
            // TODO: Add more cases and extract reference info from respective comment
            switch (patternApplications[i].pattern.constructor) {
                case syntax.FunctionDeclarationPattern:
                    foundReferences.push(new exports.FunctionReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;
            }
        }

        var namespacedReferences = exports.getReferencesFromPatternApplications(patternApplications[i].namespacedApplications, input, referenceCommentIndex);

        foundReferences.push(...namespacedReferences.foundReferences);

        referenceCommentIndex = namespacedReferences.referenceCommentIndex;
        referenceDataCued = null;
    }

    return {foundReferences, referenceCommentIndex};
};

exports.parse = function(input) {
    var tokens = exports.tokenise(input);

    console.log(exports.getReferencesFromPatternApplications(exports.getPatternApplicationsFromTokens(tokens), input));

    return exports.getPatternApplicationsFromTokens(tokens);
};