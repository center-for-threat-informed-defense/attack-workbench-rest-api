import globals from "globals";
import pluginJs from "@eslint/js";
// import tseslint from "typescript-eslint"; // TODO uncomment after TS migration
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
    // Base config for all files - adding Node.js globals
    { 
        files: ["**/*.{js,mjs,cjs,ts}"],
        languageOptions: { 
            globals: {
                ...globals.browser,
                ...globals.node     // Add Node.js globals which include 'require' and 'exports'
            },
            sourceType: "commonjs"  // Set sourceType to commonjs
        }
    },
    // Specific config for test files
    {
        files: ["**/*.test.js", "**/*.spec.js", "**/tests/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.mocha
            },
            sourceType: "commonjs"  // Set sourceType to commonjs for tests
        }
    },
    pluginJs.configs.recommended,
    // ...tseslint.configs.recommended, // uncomment after TS migration
    eslintPluginPrettierRecommended
];