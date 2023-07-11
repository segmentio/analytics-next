const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig(__dirname, {
  projects: ['<rootDir>', '<rootDir>/../core-integration-tests'],
})
