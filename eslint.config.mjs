// ESLint flat config for theme JS (ESM)
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "public/**",
      "resources/**",
      "**/*.min.js",
    ],
  },
  {
    files: ["themes/karuta/static/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Strengthened rules for CI
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": "error",
      "no-redeclare": "error",
      "no-implicit-globals": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],

      // Helpful but non-blocking locally
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "no-console": "off",
    },
  },
];
