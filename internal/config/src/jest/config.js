const { getJestModuleMap } = require('./get-module-map')
const path = require('path')

/**
 * Create Config
 * @param {import('jest').Config} Overrides.
 * @param {object} getJestModuleMap options.
 * @returns {import('jest').Config}
 */
const createJestTSConfig = (
  { modulePathIgnorePatterns, testMatch, ...overridesToMerge } = {},
  { packageRoot, skipPackageMap } = {}
) => {
  return {
    displayName: path.basename(process.cwd()),
    moduleNameMapper: getJestModuleMap(packageRoot, skipPackageMap),
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
