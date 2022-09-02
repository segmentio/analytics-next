module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(test).[jt]s?(x)"],
  clearMocks: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  projects: [
    "<rootDir>",
    "<rootDir>/../core-integration-tests"
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
