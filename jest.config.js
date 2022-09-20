const { createJestTSConfig } = require('@internal/config')

/**
 * This config detects our monorepo, and allows
 * you to run every single package test in a single jest instance using 'yarn jest'.
 * Thus, `yarn jest --watch` works as expected (unlike say, when using turborepo)
 */
module.exports = createJestTSConfig(
  {
    projects: ['<rootDir>/packages/*'],
  },
  { packageRoot: '.' }
)
