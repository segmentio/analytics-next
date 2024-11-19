const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig(__dirname, {
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests', '<rootDir>/qa'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 74,
      functions: 80,
      lines: 87,
      statements: 82,
    },
  },
})
