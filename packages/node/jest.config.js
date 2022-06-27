module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(test).[jt]s?(x)"],
  clearMocks: true,
  moduleNameMapper: {
    '@/(.+)': '<rootdir>/../../src/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
