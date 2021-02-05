/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var syntax = require("./syntax");
var references = require("./references");

exports.ParseError = class extends Error {}

exports.Reference = class {
    constructor(identifier, synopsis = "") {
        this.identifier = identifier;
        this.synopsis = synopsis;
    }
};

exports.NamespaceReference = class extends exports.Reference {
    constructor(identifier, synopsis = "") {
        super(identifier, synopsis);

        this.fields = [];
    }
}

exports.FunctionReference = class extends exports.Reference {
    constructor(identifier, synopsis = "", parameters = [], returns = new references.Return("undefined")) {
        super(identifier, synopsis);

        this.parameters = parameters;
        this.returns = returns;
    }
};

exports.ClassReference = class extends exports.FunctionReference {
    constructor(identifier, synopsis = "", parameters = [], returns = new references.Return("undefined"), extendsIdentifier = "") {
        super(identifier, synopsis, parameters, returns);

        this.extendsIdentifier = extendsIdentifier;

        this.fields = [];
    }
};

exports.PropertyReference = class extends exports.Reference {};

exports.PropertyAccessReference = class extends exports.PropertyReference {
    constructor(identifier, synopsis = "", method = "set") {
        super(identifier, synopsis);

        this.method = method;
    }
};

exports.VariableReference = class extends exports.Reference {
    constructor(identifier, synopsis = "", readOnly = false) {
        super(identifier, synopsis);

        this.readOnly = readOnly;
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
            switch (patternApplications[i].pattern.constructor) {
                case syntax.NamespacePattern:
                    foundReferences.push(new exports.NamespaceReference(patternApplications[i].pattern.shape[3].value, referenceCommentIndex.synopsis));

                    break;
                case syntax.FunctionDeclarationPattern:
                    foundReferences.push(new exports.FunctionReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;

                case syntax.FunctionExportPattern:
                    foundReferences.push(new exports.FunctionReference(patternApplications[i].pattern.shape[2].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;

                case syntax.FunctionExpressionPattern:
                    foundReferences.push(new exports.FunctionReference(patternApplications[i].pattern.shape[0].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;

                case syntax.ClassDeclarationPattern:
                    foundReferences.push(new exports.ClassReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;

                case syntax.ClassExportPattern:
                    foundReferences.push(new exports.ClassExportPattern(patternApplications[i].pattern.shape[2].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;

                case syntax.ClassExpressionPattern:
                    foundReferences.push(new exports.ClassReference(patternApplications[i].pattern.shape[0].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;
                
                case syntax.ClassExtensionDeclarationPattern:
                    foundReferences.push(new exports.ClassReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns, patternApplications[i].pattern.shape[3].value));

                    break;

                case syntax.ClassExtensionExportPattern:
                    foundReferences.push(new exports.ClassExportPattern(patternApplications[i].pattern.shape[2].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns, patternApplications[i].pattern.shape[6].value));

                    break;

                case syntax.ClassExtensionExpressionPattern:
                    foundReferences.push(new exports.ClassReference(patternApplications[i].pattern.shape[0].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns, patternApplications[i].pattern.shape[4].value));

                    break;

                case syntax.ClassPropertyPattern:
                    foundReferences.push(new exports.PropertyReference(patternApplications[i].pattern.shape[2].value, referenceDataCued.synopsis));
                    
                    break;

                case syntax.ClassSetterPattern:
                    foundReferences.push(new exports.PropertyAccessReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, "set"));

                    break;

                case syntax.ClassGetterPattern:
                    foundReferences.push(new exports.PropertyAccessReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, "get"));

                    break;

                case syntax.ClassMethodPattern:
                    foundReferences.push(new exports.FunctionReference(patternApplications[i].pattern.shape[0].value, referenceDataCued.synopsis, referenceDataCued.parameters, referenceDataCued.returns));

                    break;

                case syntax.ConstantPattern:
                    foundReferences.push(new exports.VariableReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, true));

                    break;

                case syntax.VariablePattern:
                    foundReferences.push(new exports.VariableReference(patternApplications[i].pattern.shape[1].value, referenceDataCued.synopsis, false));

                    break;

                case syntax.ExportPattern:
                    foundReferences.push(new exports.VariableReference(patternApplications[i].pattern.shape[2].value, referenceDataCued.synopsis, false));

                    break;

                case syntax.BlockScope:
                    var namespacedReferences = exports.getReferencesFromPatternApplications(patternApplications[i].namespacedApplications, input, referenceCommentIndex);

                    foundReferences = foundReferences.concat(namespacedReferences.foundReferences);
                    referenceCommentIndex = namespacedReferences.referenceCommentIndex;
            }

            if ([
                syntax.NamespacePattern,
                syntax.ClassDeclarationPattern,
                syntax.ClassExpressionPattern,
                syntax.ClassExportPattern,
                syntax.ClassExtensionDeclarationPattern,
                syntax.ClassExtensionExpressionPattern,
                syntax.ClassExtensionExportPattern
            ].includes(patternApplications[i].pattern.constructor)) {
                var namespacedReferences = exports.getReferencesFromPatternApplications(patternApplications[i].namespacedApplications, input, referenceCommentIndex);

                foundReferences[foundReferences.length - 1].fields = namespacedReferences.foundReferences;
                referenceCommentIndex = namespacedReferences.referenceCommentIndex;
            }
        }

        referenceDataCued = null;
    }

    return {foundReferences, referenceCommentIndex};
};

exports.parse = function(input) {
    var tokens = exports.tokenise(input);

    console.log(exports.getReferencesFromPatternApplications(exports.getPatternApplicationsFromTokens(tokens), input));

    return exports.getPatternApplicationsFromTokens(tokens);
};