module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
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
