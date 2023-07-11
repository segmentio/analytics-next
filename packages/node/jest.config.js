const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig(__dirname, {
  setupFilesAfterEnv: ['./jest.setup.js'],
})
