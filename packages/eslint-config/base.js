import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
export const baseConfig = defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // 12.2 TypeScript Type Safety
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",

      // 12.3 Function Signature / Complexity
      "max-params": ["error", 2],
      "sonarjs/cognitive-complexity": ["error", 15],
      complexity: ["error", 12],
      "max-statements": ["error", 30],
      "max-lines-per-function": [
        "error",
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 4],

      // 12.4 File Size Limit
      "max-lines": [
        "error",
        { max: 450, skipBlankLines: true, skipComments: true },
      ],
      "max-classes-per-file": ["error", 1],

      // 12.6 Import Rules
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/no-cycle": "error",
      "import/no-extraneous-dependencies": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "moment",
              message: "moment is forbidden. Use date-fns instead.",
            },
            {
              name: "lodash",
              message:
                "Importing lodash entirely is forbidden. Import specific functions or use lodash-es.",
            },
          ],
          patterns: [
            {
              group: ["packages/core/*"],
              message:
                "packages/core should not import from apps or contain platform-specific imports.",
            },
            {
              group: ["apps/*"],
              message:
                "apps should not be imported directly. Depend on them cleanly.",
            },
          ],
        },
      ],

      // 12.7 Base Stability
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-debugger": "error",
      "no-console": "error",
    },
  },
  {
    // 12.8 Overrides Policy
    // Relax rules for test files, scripts, and tooling
    files: [
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "scripts/**",
      "**/*.config.*",
      "jest.setup.js",
    ],
    rules: {
      "no-console": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-statements": "off",
      "@typescript-eslint/no-explicit-any": "off", // Usually looser in tests
    },
  }
);
