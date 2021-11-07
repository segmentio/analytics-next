const typescript = require('@rollup/plugin-typescript')
const replace = require('@rollup/plugin-replace')
const { terser } = require('rollup-plugin-terser')

const { version } = require('./package.json')

function sourcemapPathTransform(relativeSourcePath) {
  // sourcemaps have extra nesting for whatever reason
  return relativeSourcePath.replace('../', '')
}

function external(importSpecifier, parentId, isResolved) {
  return !isResolved && !importSpecifier.startsWith('.')
}

function getEnvironmentValues(defaults) {
  const output = {}
  Object.keys(defaults).forEach((key) => {
    output['process.env.' + key] = JSON.stringify(
      process.env[key] || defaults[key]
    )
  })
  return output
}

const replacePlugin = replace({
  preventAssignment: true,
  values: getEnvironmentValues({
    ASSET_PATH: '',
    DEBUG: false,
    LEGACY_INTEGRATIONS_PATH: '',
    NODE_ENV: 'production',
    VERSION: version,
  }),
})

const input = ['src/index.ts']
const exclude = ['**/__tests__/**', 'src/tester/**']

module.exports = [
  {
    input,
    external,
    output: {
      dir: 'dist/pkg',
      format: 'es',
      preserveModules: true,
      sourcemap: true,
      sourcemapPathTransform,
    },
    plugins: [
      replacePlugin,
      typescript({
        declaration: true,
        outDir: 'dist/pkg',
        exclude,
      }),
      terser(),
    ],
  },
  {
    input,
    external,
    output: {
      exports: 'auto',
      dir: 'dist/cjs',
      format: 'cjs',
      preserveModules: true,
      sourcemap: true,
      sourcemapPathTransform,
    },
    plugins: [
      replacePlugin,
      typescript({
        declaration: true,
        outDir: 'dist/cjs',
        exclude,
      }),
      terser(),
    ],
  },
]
