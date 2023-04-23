/** @type { import('eslint').Linter.Config } */
module.exports = {
  extends: ['./.eslintrc'],
  plugins: ['import'],
  overrides: [
    {
      // this library should not have any node OR browser runtime dependencies.
      // In particular, nextjs and vercel edge functions will break if _any_ node dependencies are introduced.
      files: ['src/**'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-properties': [
          'error',
          {
            object: 'window',
            property: 'document',
          },
          {
            object: 'navigator',
          },
        ],
        'no-restricted-globals': ['error', 'document'],
        'import/no-nodejs-modules': 'error',
      },
    },
  ],
}
