/*
    subDoc

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

exports.Identifier = class {
    constructor(value = null) {
        this.value = value;
    }
};

exports.Token = class {
    constructor(token) {
        this.token = token;
    }
};

exports.TokensUntil = class {
    constructor(token, value = []) {
        this.token = token;
        this.value = value;
    }
};

exports.Pattern = class {
    constructor(shape = [], end = new exports.Token("")) {
        this.shape = shape;
        this.end = end;
    }

    fulfilsAt(token, index) {
        if (index >= this.shape.length) {
            return false;
        }

        if (this.shape[index] instanceof exports.Identifier) {
            this.shape[index].value = token;

            return true;
        }

        if (this.shape[index] instanceof exports.Token && this.shape[index].token == token) {
            return true;
        }

        if (this.shape[index] instanceof exports.TokensUntil) {
            if (this.shape[index].token != token) {
                this.shape[index].value.push(token);
            }

            return true;
        }

        return false;
    }

    mustHoldBackShapeIndex(token, index) {
        return this.shape[index] instanceof exports.TokensUntil && this.shape[index + 1].token != token;
    }
};

exports.BlockCommentPattern = class extends exports.Pattern {
    constructor() {
        // /*
        super(
            [new exports.Token("/*")],
            new exports.Token("*/")
        );
    }
};

exports.FunctionDeclarationPattern = class extends exports.Pattern {
    constructor() {
        // function ? (??) {
        super(
            [new exports.Token("function"), new exports.Identifier(), new exports.Token("("), new exports.TokensUntil(")"), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.FunctionExpressionPattern = class extends exports.Pattern {
    constructor() {
        // ? = function(??) {
        super(
            [new exports.Identifier(), new exports.Token("="), new exports.Token("function"), new exports.Token("("), new exports.TokensUntil(")"), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.FunctionExportPattern = class extends exports.Pattern {
    constructor() {
        // exports.? = function(??) {
        super(
            [new exports.Token("exports"), new exports.Token("."), new exports.Identifier(), new exports.Token("="), new exports.Token("function"), new exports.Token("("), new exports.TokensUntil(")"), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassDeclarationPattern = class extends exports.Pattern {
    constructor() {
        // class ? {
        super(
            [new exports.Token("class"), new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassExpressionPattern = class extends exports.Pattern {
    constructor() {
        // class ? {
        super(
            [new exports.Identifier(), new exports.Token("="), new exports.Token("class"), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassExportPattern = class extends exports.Pattern {
    constructor() {
        // class ? {
        super(
            [new exports.Token("exports"), new exports.Token("."), new exports.Identifier(), new exports.Token("="), new exports.Token("class"), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassExtensionDeclarationPattern = class extends exports.Pattern {
    constructor() {
        // class ? {
        super(
            [new exports.Token("class"), new exports.Identifier(), new exports.Token("extends"), new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassExtensionExpressionPattern = class extends exports.Pattern {
    constructor() {
        // class ? {
        super(
            [new exports.Identifier(), new exports.Token("="), new exports.Token("class"), new exports.Token("extends"), new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassExtensionExportPattern = class extends exports.Pattern {
    constructor() {
        // class ? {
        super(
            [new exports.Token("exports"), new exports.Token("."), new exports.Identifier(), new exports.Token("="), new exports.Token("class"), new exports.Token("extends"), new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassPropertyPattern = class extends exports.Pattern {
    constructor() {
        // this.? =
        super(
            [new exports.Token("this"), new exports.Token("."), new exports.Identifier(), new exports.Token("=")],
            new exports.Token(";")
        );
    }
};

exports.ClassSetterPattern = class extends exports.Pattern {
    constructor() {
        // set ? {
        super(
            [new exports.Token("set"), new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassGetterPattern = class extends exports.Pattern {
    constructor() {
        // get ? {
        super(
            [new exports.Token("get"), new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ClassMethodPattern = class extends exports.Pattern {
    constructor() {
        // ? {
        super(
            [new exports.Identifier(), new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.ConstantPattern = class extends exports.Pattern {
    constructor() {
        // const ? =
        super(
            [new exports.Token("const"), new exports.Identifier(), new exports.Token("=")],
            new exports.Token(";")
        );
    }
};

exports.VariablePattern = class extends exports.Pattern {
    constructor() {
        // var ? =
        super(
            [new exports.Token("var"), new exports.Identifier(), new exports.Token("=")],
            new exports.Token(";")
        );
    }
};

exports.ExportPattern = class extends exports.Pattern {
    constructor() {
        // exports.? =
        super(
            [new exports.Token("exports"), new exports.Token("."), new exports.Identifier(), new exports.Token("=")],
            new exports.Token(";")
        );
    }
};

exports.BlockScope = class extends exports.Pattern {
    constructor() {
        // {
        super(
            [new exports.Token("{")],
            new exports.Token("}")
        );
    }
};

exports.PatternApplication = class {
    constructor(pattern, valueTokens = [], namespacedApplications = []) {
        this.pattern = pattern;
        this.valueTokens = valueTokens;
        this.namespacedApplications = namespacedApplications;

        this.shapeIndex = 0;
    }

    get highestShapeIndex() {
        var shapeIndexTotal = 0;

        for (var i = 0; i < this.pattern.shape.length; i++) {
            if (!(this.pattern.shape[i] instanceof exports.TokensUntil)) {
                shapeIndexTotal++;
            }
        }

        return shapeIndexTotal;
    }
};

exports.patterns = [
    new exports.BlockCommentPattern(),
    new exports.FunctionDeclarationPattern(),
    new exports.FunctionExpressionPattern(),
    new exports.FunctionExportPattern(),
    new exports.ClassDeclarationPattern(),
    new exports.ClassExpressionPattern(),
    new exports.ClassExportPattern(),
    new exports.ClassExtensionDeclarationPattern(),
    new exports.ClassExtensionExpressionPattern(),
    new exports.ClassExtensionExportPattern(),
    new exports.ClassPropertyPattern(),
    new exports.ClassSetterPattern(),
    new exports.ClassGetterPattern(),
    new exports.ClassMethodPattern(),
    new exports.ConstantPattern(),
    new exports.VariablePattern(),
    new exports.ExportPattern(),
    new exports.BlockScope()
];