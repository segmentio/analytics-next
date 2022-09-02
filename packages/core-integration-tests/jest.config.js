const { getJestModuleMap } = require('@internal/config')

module.exports = {
  moduleNameMapper: getJestModuleMap("../../"),
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  clearMocks: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
