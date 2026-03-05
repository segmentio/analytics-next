const { createJestTSConfig } = require('@internal/config')

module.exports = createJestTSConfig(__dirname, {
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests', '<rootDir>/qa'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@segment/analytics-page-tools$': '<rootDir>/../page-tools/src',
  },
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
})
