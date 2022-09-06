/** @type { import('eslint').Linter.Config } */
module.exports = {
  ignorePatterns: ['e2e-tests', 'qa', '/*.tmp.*/'],
  extends: ['../../.eslintrc'],
  env: {
    node: true, // TODO: change to false when node is abstracted out
    browser: true,
  },
}
