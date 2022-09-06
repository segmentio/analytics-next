const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig({
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests', '<rootDir>/qa'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 80.91,
      functions: 87.25,
      lines: 91.03,
      statements: 87.25,
    },
  },
})
