import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Ignore patterns
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "generated/**",
      "migrations/**",
      "out/**",
      "build/**",
      "env.config.ts", // This file reads from process.env
      "src/lib/prisma/index.ts", // Prisma initialization reads from process.env
    ],
  },

  // Next.js config (it's already a flat config array that includes TypeScript support)
  ...nextConfig,

  // Base rules for all files
  {
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "@next/next/no-img-element": "off",
    },
  },

  // TypeScript files configuration - additional rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["arrowFunctions"] },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "react/no-unknown-property": [2, { ignore: ["jsx", "global"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Use 'env' from '@/env.config' instead of process.env. Import: import { env } from '@/env.config'",
        },
      ],
    },
  },

  // Non-test TypeScript files - prevent expect() usage
  {
    files: ["**/*.ts"],
    ignores: ["**/*.test.ts", "test/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'CallExpression[callee.name="expect"]',
          message: "`expect` is not allowed in non-test files.",
        },
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Use 'env' from '@/env.config' instead of process.env. Import: import { env } from '@/env.config'",
        },
      ],
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.ts", "test/**/*.ts"],
    rules: {
      // Allow process.env in test files
      "no-restricted-syntax": "off",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },
];

export default config;
