const { createJestTSConfig } = require('@internal/config')

/**
 * This config detects our monorepo, and allows
 * you to run every single package test in a single jest instance using 'yarn jest'.
 * Thus, `yarn jest --watch` works as expected (unlike say, when using turborepo)
 */
module.exports = () => {
  // we actually need to set a global variable to preserve the correct path mapping when running project-wide jest.
  global.JEST_ROOT_CONFIG = true

  const config = createJestTSConfig({
    projects: ['<rootDir>/packages/*'],
  })
  return config
}
