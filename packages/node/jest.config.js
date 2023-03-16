const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig({
  setupFilesAfterEnv: ['./jest.setup.js'],
})
