module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(test).[jt]s?(x)"],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
