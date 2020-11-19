module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  clearMocks: true,
  testEnvironmentOptions: {
    resources: 'usable',
  },
  moduleNameMapper: {
    '@/(.+)': '<rootdir>/../../src/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  coverageThreshold: {
    global: {
      branches: 80.91,
      functions: 87.25,
      lines: 91.03,
      statements: 87.25,
    },
  },
}
