/** @type { import('eslint').Linter.Config } */
module.exports = {
  extends: ['../../.eslintrc'],
  env: {
    node: true,
  },
  rules: {
    '@typescript-eslint/no-empty-interface': 'off', // since this is a lib, sometimes we want to use interfaces rather than types for the ease of declaration merging.
  },
}
