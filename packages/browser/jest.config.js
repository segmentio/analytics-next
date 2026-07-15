const { createJestTSConfig } = require('@internal/config')

// These suites load real third-party scripts over the network (jsdom
// `resources: 'usable'` fetching e.g. cdn.segment.com / cdn.amplitude.com
// destination bundles). That's fine on GitHub Actions / local dev (open
// internet), but hangs/times out on locked-down CI agents with no egress
// (e.g. Twilio Buildkite's general-039 queue) - confirmed on-agent, not a
// guess. Set SKIP_NETWORK_TESTS=1 there to exclude them; they still run
// everywhere else so coverage isn't lost, just moved to a pipeline with
// the right security context (open egress) to run them.
const networkDependentTests = [
  '<rootDir>/src/browser/__tests__/integration.test.ts',
  '<rootDir>/src/browser/__tests__/integrations.integration.test.ts',
  '<rootDir>/src/plugins/ajs-destination/__tests__/index.test.ts',
  '<rootDir>/src/plugins/schema-filter/__tests__/index.test.ts',
]

module.exports = createJestTSConfig(__dirname, {
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests', '<rootDir>/qa'],
  testPathIgnorePatterns: [
    '/node_modules/',
    ...(process.env.SKIP_NETWORK_TESTS ? networkDependentTests : []),
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@segment/analytics-page-tools$': '<rootDir>/../page-tools/src',
  },
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
})
