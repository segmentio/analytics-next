const { getJestModuleMap } = require('./get-module-map')
const path = require('path')

/**
 * Create Config
 * @param {import('jest').Config} Overrides.
 * @param {object} getJestModuleMap options.
 * @returns {import('jest').Config}
 */
const createJestTSConfig = ({
  modulePathIgnorePatterns,
  testMatch,
  ...overridesToMerge
} = {}) => {
  const moduleMap = getJestModuleMap()
  return {
    ...(global.JEST_ROOT_CONFIG
      ? {}
      : { displayName: path.basename(process.cwd()) }),
    moduleNameMapper: moduleMap,
    preset: 'ts-jest',
    modulePathIgnorePatterns: [
      '<rootDir>/dist/',
      ...(modulePathIgnorePatterns || []),
    ],
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(test).[jt]s?(x)', ...(testMatch || [])],
    clearMocks: true,
    globals: {
      'ts-jest': {
        isolatedModules: true,
      },
    },
    ...(overridesToMerge || {}),
  }
}

module.exports = {
  createJestTSConfig,
}
