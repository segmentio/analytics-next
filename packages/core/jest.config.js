const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig({
  projects: ['<rootDir>', '<rootDir>/../core-integration-tests'],
})
