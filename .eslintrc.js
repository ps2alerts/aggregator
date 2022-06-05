module.exports = {
    "env": {
        "es2020": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "rules": {
        // @typescript-eslint rules
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "array-simple"
            }
        ],
        "@typescript-eslint/consistent-type-definitions": [
            "error",
            "interface"
        ],
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/explicit-member-accessibility": [
            "error",
            {
                "accessibility": "explicit",
                "overrides": {
                    "accessors": "no-public",
                    "constructors": "no-public"
                }
            }
        ],
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "comma",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/member-ordering": [
            "error",
            {
                "classes": [
                    "public-static-field",
                    "public-instance-field",
                    "private-static-field",
                    "private-instance-field",
                    "field",
                    "constructor",
                    "public-static-method",
                    "public-instance-method",
                    "private-static-method",
                    "private-instance-method",
                    "method"
                ],
                "interfaces": [
                    "field",
                    "constructor",
                    "method",
                    "signature"
                ],
                "typeLiterals": [
                    "field",
                    "constructor",
                    "method",
                    "signature"
                ]
            }
        ],
        "@typescript-eslint/method-signature-style": [
            "error",
            "method"
        ],
        "@typescript-eslint/naming-convention": [
            "warn",
            {
                "selector": "variableLike",
                "format": ["camelCase"]
            },
            {
                "selector": "memberLike",
                "format": ["camelCase"]
            },
            {
                "selector": "typeLike",
                "format": ["PascalCase"]
            },
            {
                "selector": "variable",
                "format": ["camelCase", "UPPER_CASE"]
            },
            {
                "selector": "parameter",
                "format": ["camelCase"],
                "leadingUnderscore": "allow"
            },
            {
                "selector": "memberLike",
                "modifiers": ["private"],
                "format": ["camelCase"],
                "leadingUnderscore": "allow"
            },
            {
                "selector": "property",
                "modifiers": ["static", "readonly"],
                "types": ["boolean", "string", "number"],
                "format": ["UPPER_CASE"]
            },
            {
                "selector": "enumMember",
                "format": ["UPPER_CASE"]
            }
        ],
        "@typescript-eslint/no-base-to-string": "error",
        "@typescript-eslint/no-confusing-non-null-assertion": "error",
        "@typescript-eslint/no-dynamic-delete": "error",
        "@typescript-eslint/no-invalid-void-type": "error",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/require-await": "warn",
        "@typescript-eslint/no-throw-literal": "error",
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-includes": "error",
        "@typescript-eslint/prefer-literal-enum-member": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-readonly": "error",
        "@typescript-eslint/prefer-string-starts-ends-with": "error",
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/type-annotation-spacing": "error",

        // @typescript-eslint extension rules
        "@typescript-eslint/brace-style": "error",
        "@typescript-eslint/comma-spacing": "error",
        "@typescript-eslint/default-param-last": "error",
        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/func-call-spacing": "error",
        "@typescript-eslint/indent": [
            "error",
            4,
            {
                "SwitchCase": 1,
                "CallExpression": {
                    "arguments": "first"
                },
                "FunctionExpression": {
                    "parameters": "first"
                },
                "flatTernaryExpressions": true
            }
        ],
        "@typescript-eslint/keyword-spacing": "error",
        "@typescript-eslint/lines-between-class-members": [
            "error",
            {
                "exceptAfterSingleLine": true
            }
        ],
        "@typescript-eslint/no-dupe-class-members": "error",
        "@typescript-eslint/no-extra-parens": [
            "error",
            "functions"
        ],
        "@typescript-eslint/no-invalid-this": "error",
        "@typescript-eslint/no-loss-of-precision": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "error",
        "@typescript-eslint/no-useless-constructor": "error",
        "@typescript-eslint/quotes": [
            "error",
            "single"
        ],
        "@typescript-eslint/semi": "error",
        "@typescript-eslint/space-before-function-paren": [
            "error",
            {
                "anonymous": "never",
                "named": "never",
                "asyncArrow": "always"
            }
        ],

        // eslint: Possible Errors
        "no-console": "warn",

        // eslint: Best Practices
        "curly": "error",
        "eqeqeq": "error",
        "max-classes-per-file": "error",
        "no-alert": "error",
        "no-constructor-return": "error",
        "no-extend-native": "error",
        "no-floating-decimal": "error",
        "no-labels": "error",
        "no-lone-blocks": "error",
        "no-multi-spaces": "error",
        "no-new": "error",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-octal-escape": "error",
        "no-self-compare": "error",
        "no-unmodified-loop-condition": "error",
        "no-useless-concat": "error",
        "no-useless-return": "error",
        "prefer-promise-reject-errors": "error",
        "radix": "error",
        "yoda": "error",

        // eslint: Variables
        "no-shadow": 0,

        // eslint: Stylistic Issues
        "array-bracket-newline": [
            "error",
            "consistent"
        ],
        "array-bracket-spacing": "error",
        "comma-dangle": [
            "error",
            "always-multiline"
        ],
        "comma-style": "error",
        "computed-property-spacing": "error",
        "eol-last": "error",
        "function-call-argument-newline": [
            "error",
            "consistent"
        ],
        "key-spacing": "error",
        "new-parens": "error",
        "no-bitwise": "error",
        "no-multi-assign": "error",
        "no-multiple-empty-lines": [
            "error",
            {
                "max": 1,
                "maxEOF": 0
            }
        ],
        "no-trailing-spaces": "error",
        "no-unneeded-ternary": "error",
        "no-whitespace-before-property": "error",
        "object-curly-newline": [
            "error",
            {
                "consistent": true
            }
        ],
        "object-curly-spacing": [
            "error",
            "never"
        ],
        "object-property-newline": [
            "error",
            {
                "allowAllPropertiesOnSameLine": true
            }
        ],
        "one-var-declaration-per-line": [
            "error",
            "always"
        ],
        "operator-assignment": "error",
        "padding-line-between-statements": [
            "error",
            { "blankLine": "always", "prev": "import", "next": "*" },
            { "blankLine": "never", "prev": "import", "next": "import" },
            { "blankLine": "always", "prev": "multiline-block-like", "next": "*" },
            { "blankLine": "always", "prev": "*", "next": "multiline-block-like" },
        ],
        "prefer-object-spread": "error",
        "quote-props": [
            "error",
            "as-needed"
        ],
        "semi-spacing": "error",
        "semi-style": "error",
        "space-in-parens": "error",
        "space-infix-ops": "error",
        "space-unary-ops": "error",
        "spaced-comment": "error",
        "switch-colon-spacing": "error",

        // eslint: ECMAScript 6
        "arrow-parens": "error",
        "arrow-spacing": "error",
        "no-confusing-arrow": "error",
        "no-duplicate-imports": "error",
        "no-useless-rename": "error",
        "object-shorthand": "error",
        "prefer-const": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "prefer-template": "warn",
        "rest-spread-spacing": "error",
        "template-curly-spacing": "error",


        // overwrites of recommended rules
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                "argsIgnorePattern": "^_"
            }
        ]
    }
}
