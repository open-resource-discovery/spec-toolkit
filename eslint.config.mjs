import path from "node:path";
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

const baseConfig = [
  eslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      curly: ["error", "multi-line"],
      eqeqeq: "error",
      "no-console": "error",
      "no-duplicate-imports": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "no-use-before-define": ["error", { functions: false }],
      "require-await": "error",
    },
  },
];

const tsConfig = tseslint.config(
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.recommended],
    rules: {
      curly: ["error", "multi-line"],
      "@typescript-eslint/array-type": ["error", { default: "array" }],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          format: ["strictCamelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          selector: "variable",
        },
        {
          format: ["strictCamelCase"],
          selector: "function",
        },
        {
          format: ["StrictPascalCase", "UPPER_CASE"],
          selector: "enumMember",
        },
        {
          format: ["StrictPascalCase"],
          selector: "typeLike",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: false, allowDefinitionFiles: false }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-use-before-define": ["error", { functions: false }],
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "no-unused-vars": "off",
      "no-use-before-define": "off",
    },
  },
  {
    files: ["*.test.ts", "*.test.tsx", "**/__test__/**/*.ts", "**/__test__/**/*.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);

const reactConfig = [
  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          format: ["strictCamelCase", "UPPER_CASE", "StrictPascalCase"],
          leadingUnderscore: "allow",
          selector: "variable",
        },
        {
          format: ["strictCamelCase", "StrictPascalCase"],
          selector: "function",
        },
        {
          format: ["StrictPascalCase"],
          selector: "enumMember",
        },
        {
          format: ["StrictPascalCase"],
          selector: "typeLike",
        },
      ],
    },
  },
];

export default [
  ...baseConfig,
  ...tsConfig,
  ...reactConfig,
  {
    ignores: ["dist", "reports", "website/build/", "website/.docusaurus/", "src/__tests__/generated"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "require-await": "off",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/return-await": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  {
    files: ["website/**/*.ts", "website/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: path.resolve(import.meta.dirname, "./website"),
      },
    },
  },
  eslintPluginPrettierRecommended,
];
