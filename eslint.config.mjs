import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([
    globalIgnores(["src/**/*.md", "src/**/*.mock", "src/**/*.txt", "src/**/*.scss"]),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.jest,
            },

            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },

        rules: {
            "@typescript-eslint/naming-convention": ["error", {
                selector: "variable",
                format: ["UPPER_CASE", "camelCase"],
                leadingUnderscore: "allow",
            }],

            "key-spacing": ["error", {
                afterColon: true,
            }],

            "keyword-spacing": ["error", {
                before: true,
                after: true,
            }],

            "no-irregular-whitespace": "error",
            "no-trailing-spaces": "error",
            "no-multi-spaces": "error",

            "no-multiple-empty-lines": ["error", {
                max: 1,
                maxEOF: 1,
            }],

            "comma-spacing": ["error", {
                before: false,
                after: true,
            }],

            "import/order": "off",
        }
    }
]);