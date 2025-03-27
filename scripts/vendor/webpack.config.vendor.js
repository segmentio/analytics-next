const path = require('path')
const { outputDts, outputFile } = require('./helpers')

/**
 * This file builds the vendored dependencies.
 * To add a new vendored dependency, add a new entry.
 * Then run:
 *   > npm run vendor
 */

const config = {
  mode: 'production',
  target: 'web',
  entry: {
    'tsub': '@segment/tsub',
  },
  output: {
    library: '[name]',
    libraryTarget: 'commonjs2',
    filename: '[name].js',
    path: path.resolve(__dirname, '../../src/vendor/tsub'),
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  node: {
    global: false,
  },
  // Force webpack to ignore externalized modules
  externals: {
    '@segment/analytics-core': "require('@segment/analytics-core')",
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          // Write the TypeScript definition files
          outputDts(
            path.resolve(
              __dirname,
              '../../src/vendor/tsub/tsub.d.ts'
            ),
            'tsub'
          )

          // Create the type module file
          const types = `export interface Rule {
  scope: string
  target_type: string
  matchers: Matcher[]
  transformers: Transformer[][]
  destinationName?: string
}
export interface Matcher {
  type: string
  ir: string
}
export interface Transformer {
  type: string
  config?: any
}
export interface Store {
  new(rules?: Rule[]): this
  getRulesByDestinationName(destinationName: string): Rule[]
}`
          outputFile(
            path.resolve(
              __dirname,
              '../../src/vendor/tsub/types.ts'
            ),
            types
          )
        })
      },
    },
  ],
}

module.exports = config 