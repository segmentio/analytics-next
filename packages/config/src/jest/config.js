const { getJestModuleMap } = require('./get-module-map')
const path = require('path')

/**
 * Create Config
 * @param {string} dirname - __dirname from the package that's importing this config.
 * @param {import('ts-jest').JestConfigWithTsJest} Overrides.
 * @returns {import('ts-jest').JestConfigWithTsJest}
 */
const createJestTSConfig = (
  dirname,
  { modulePathIgnorePatterns, testMatch, ...overridesToMerge } = {}
) => {
  if (typeof dirname !== 'string') {
    throw new Error('Please pass __dirname as the first argument.')
  }
  const isRootConfig = dirname === process.cwd()
  const moduleMap = getJestModuleMap(dirname, isRootConfig)
  return {
    ...(isRootConfig ? {} : { displayName: path.basename(process.cwd()) }),
    /**
     * No need to manually run yarn build all the time.
     * This resolve packages for ts-jest so typescript compilation happens in-memory.
     */
    ...(process.env.COVERAGE === 'true'
      ? {
          collectCoverage: true,
          coverageReporters: ['json', 'text'],
          collectCoverageFrom: [
            'src/**/*.{js,jsx,ts,tsx}',
            '!src/**/*.test.{js,jsx,ts,tsx}',
            '!src/**/__tests__/**',
            '!src/**/test*/**',
            '!**/e2e-tests/**',
          ],
          coverageDirectory: '<rootDir>/coverage',
        }
      : {}),
    moduleNameMapper: moduleMap,
    preset: 'ts-jest',
    modulePathIgnorePatterns: [
      '<rootDir>/dist/',
      ...(modulePathIgnorePatterns || []),
    ],
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(test).[jt]s?(x)', ...(testMatch || [])],
    /**
     * No need to call jest.clearAllMocks() or jest.resetMocks() manually.
     * Automatically clear mock calls, instances and results before every test.
     * Equivalent to calling jest.clearAllMocks() before each test.
     */
    clearMocks: true,
    transform: {
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          isolatedModules: true,
        },
      ],
    },
    ...(overridesToMerge || {}),
  }
}

module.exports = {
  createJestTSConfig,
}
