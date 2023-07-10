/** @type { import('eslint').Linter.Config } */
module.exports = {
  root: true,
  ignorePatterns: ['node_modules', 'dist'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    // Turn on on eslint recommended rules https://github.com/eslint/eslint/blob/main/conf/eslint-recommended.js
    'eslint:recommended',
    // Turn off eslint rules that conflict with prettier https://github.com/prettier/eslint-config-prettier/blob/main/index.js
    'prettier',
  ],
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          './tsconfig.json',
          './packages/*/tsconfig.json',
          './examples/*/tsconfig.json',
        ],
      },
      extends: [
        // Disable rules from eslint:recommended which are already handled by TypeScript. Enables eslint (@not typescript-eslint) rules that make sense due to TS's typechecking / transpilation.
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslint-recommended.ts
        'plugin:@typescript-eslint/eslint-recommended',
        // Enable recommended rules from @typescript-eslint
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended.ts
        'plugin:@typescript-eslint/recommended',
        // Handle prettier rules through eslint https://github.com/prettier/eslint-plugin-prettier/blob/master/eslint-plugin-prettier.js#L65
        'plugin:prettier/recommended',
        // add special jest rules https://github.com/jest-community/eslint-plugin-jest#rules
        'plugin:jest/recommended',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-floating-promises': [
          'error',
          {
            ignoreVoid: true,
          },
        ],
        'require-await': 'off',
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/ban-types': 'off', // TODO: turn on
        /** jest */
        'jest/valid-title': 'off', // allow function names to be used as test titles
        'jest/no-conditional-expect': 'off', // best practice, but TODO
        'jest/no-alias-methods': 'off', // best practice, but TODO
        'jest/expect-expect': 'off', // sometimes we compose assertion functions
        'jest/no-disabled-tests': process.env.CI ? 'error' : 'off', // fail CI if tests are disabled, but do not interfere with local development
        'jest/no-focused-tests': process.env.CI ? 'error' : 'off',
      },
      overrides: [
        {
          files: ['**/__tests__/**', '**/scripts/**'],
          rules: {
            'require-await': 'off',
            '@typescript-eslint/require-await': 'off',
          },
        },
      ],
    },
    {
      files: ['*.{js,mjs}'],
      env: {
        // Config files and possible scripts. Allow anything, we don't really care.
        browser: true,
        node: true,
      },
      extends: [
        // Handle prettier rules through eslint https://github.com/prettier/eslint-plugin-prettier/blob/master/eslint-plugin-prettier.js#L65
        'plugin:prettier/recommended',
      ],
    },
  ],
}
