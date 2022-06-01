/** @type { import('eslint').Linter.Config } */
module.exports = {
  extends: ["../../.eslintrc", "plugin:@next/next/recommended"],
  env: {
    "browser": true,
    "node": true
  }
}
