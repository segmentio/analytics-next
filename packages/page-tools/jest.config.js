const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig(__dirname, {
  testEnvironment: 'jsdom',
})
