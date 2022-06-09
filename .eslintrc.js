/** @type { import('eslint').Linter.Config } */
module.exports = {
  root: true,
  ignorePatterns: ["node_modules", "dist"],
  parserOptions: {
    ecmaVersion: 2019
  },
  env: {
    "node": true,
  },
  extends: [
    // Turn on on eslint recommended rules https://github.com/eslint/eslint/blob/main/conf/eslint-recommended.js
    "eslint:recommended",
    // Turn off eslint rules that conflict with prettier https://github.com/prettier/eslint-config-prettier/blob/main/index.js
    "prettier"
  ],
  overrides: [
    {
      "files": ["*.{ts,tsx}"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "project": [
          "./tsconfig.json",
          "./packages/*/tsconfig.json",
          "./examples/*/tsconfig.json"
        ]
      },
      extends: [
        // Disable rules from eslint:recommended which are already handled by TypeScript. Enables eslint (@not typescript-eslint) rules that make sense due to TS's typechecking / transpilation.
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslint-recommended.ts
        "plugin:@typescript-eslint/eslint-recommended",
        // Enable recommended rules from @typescript-eslint
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended.ts
        "plugin:@typescript-eslint/recommended",
        // Handle prettier rules through eslint https://github.com/prettier/eslint-plugin-prettier/blob/master/eslint-plugin-prettier.js#L65
        "plugin:prettier/recommended"
      ],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-floating-promises": [
          "error",
          {
            "ignoreVoid": true
          }
        ],
        "require-await": "off",
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/ban-types": "off" // TODO: turn on
      },
      overrides: [
        {
          "files": ["*.test.*"],
          "rules": {
            "require-await": "off",
            "@typescript-eslint/require-await": "off"
          }
        }
      ]
    }
  ]
}
