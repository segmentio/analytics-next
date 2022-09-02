const { getJestModuleMap } = require("@internal/config")
module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(test).[jt]s?(x)"],
  clearMocks: true,
  moduleNameMapper: getJestModuleMap(),
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
