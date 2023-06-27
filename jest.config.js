const { createJestTSConfig } = require('@internal/config')

/**
 * This config detects our monorepo, and allows
 * you to run every single package test in a single jest instance using 'yarn jest'.
 * Thus, `yarn jest --watch` works as expected (unlike say, when using turborepo)
 */
module.exports = () =>
  createJestTSConfig(__dirname, {
    projects: [
      // being explicit here, as a globbing bug means that using packages/* can cause problems in non-worktrees (haven't fully investigated yet).
      '<rootDir>/packages/core',
      '<rootDir>/packages/core-integration-tests',
      '<rootDir>/packages/node',
      '<rootDir>/packages/browser',
      '<rootDir>/packages/consent/consent-tools',
      '<rootDir>/packages/consent/consent-wrapper-onetrust',
    ],
  })
