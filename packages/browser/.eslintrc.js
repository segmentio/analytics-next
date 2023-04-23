/** @type { import('eslint').Linter.Config } */
module.exports = {
  ignorePatterns: ['e2e-tests', 'qa', '/*.tmp.*/'],
  extends: ['@internal/eslint-config/base'],
}
