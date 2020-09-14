module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  clearMocks: true,
  moduleNameMapper: {
    '@/(.+)': '<rootdir>/../../src/$1',
  },
}
