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
        'no-restricted-globals': [
          'error',
          'document',
          'window',
          'self',
          'process',
          'global',
          'navigator',
          'location',
        ],
        'import/no-nodejs-modules': 'error',
      },
    },
  ],
}
