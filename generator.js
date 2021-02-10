/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const UNICODE_VARSEL_EMOJI = "\uFE0F"

const REFERENCE_SYMBOLS = {
    "function": "▶" + UNICODE_VARSEL_EMOJI,
    "class": "🎛" + UNICODE_VARSEL_EMOJI,
    "method": "⏩" + UNICODE_VARSEL_EMOJI,
    "static": "❄️" + UNICODE_VARSEL_EMOJI,
    "prop": "🔡" + UNICODE_VARSEL_EMOJI,
    "const": "🔒" + UNICODE_VARSEL_EMOJI,
    "var": "🔠" + UNICODE_VARSEL_EMOJI,
    "generator": "♾" + UNICODE_VARSEL_EMOJI,
};

const REFERENCE_SYMBOL_OTHER = "🔣";

function sortReferences(references) {
    return references.sort(function(a, b) {
        if (a.name < b.name) {
            return -1;
        }

        if (a.name > b.name) {
            return 1;
        }

        return 0;
    });
}

function getReferenceSymbol(referenceType) {
    return REFERENCE_SYMBOLS[referenceType.split(" ")[0]] || REFERENCE_SYMBOL_OTHER;
}

/*
    @name generator.generateMarkdown
    Generate a Markdown file given a namespace.
    @param namespace <parser.Namespace> Namespace to generate Markdown with
*/
exports.generateMarkdown = function(namespace) {
    var sortedReferences = sortReferences(namespace.references);
    var markdown = "";

    markdown += `# ${namespace.name.trim() == "" ? "(global)" : namespace.name}\n`;

    sortedReferences.forEach(function(reference) {
        markdown += `## ${getReferenceSymbol(reference.type)} \`${reference.name}\`\n`;
        markdown += `\`${reference.type}\``;

        if (reference.synopsis.trim() != "") {
            markdown += ` · ${reference.synopsis}`;
        }

        markdown += `\n`;

        if (reference.parameters.length > 0) {
            markdown += `\n**Parameters:**\n`;

            reference.parameters.forEach(function(parameter) {
                var typeAnnotation = `\`${parameter.type}\`${parameter.defaultValue != "undefined" ? " = \`" + parameter.defaultValue + "\`" : ""}`;
                var descriptionAnnotation = ``;

                if (parameter.description.trim != "") {
                    descriptionAnnotation = `: ${parameter.description.trim()}`;
                }

                markdown += `* **\`${parameter.identifier}\`** (${typeAnnotation})${descriptionAnnotation}\n`;
            });
        }

        if (reference.returns.type != "undefined") {
            if (reference.returns.description.trim() != "") {
                markdown += `\n**Returns:** \`${reference.returns.type}\` · ${reference.returns.description}\n`;
            } else {
                markdown += `\n**Returns:** \`${reference.returns.type}\`\n`;
            }
        }

        markdown += `\n`;
    });

    return markdown;
};