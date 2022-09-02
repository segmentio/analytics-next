const { getJestModuleMap } = require('@internal/config')

module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/e2e-tests',
    '<rootDir>/qa',
  ],
  testEnvironment: 'jsdom',
  testMatch: ["**/?(*.)+(test).[jt]s?(x)"],
  clearMocks: true,
  testEnvironmentOptions: {
    resources: 'usable',
  },
  moduleNameMapper: getJestModuleMap(),
  setupFilesAfterEnv: ['./jest.setup.js'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  reporters: ['default'],
  coverageThreshold: {
    global: {
      branches: 80.91,
      functions: 87.25,
      lines: 91.03,
      statements: 87.25,
    },
  },
}
