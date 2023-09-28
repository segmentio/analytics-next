const TerserPlugin = require('terser-webpack-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const {
  ECMAVersionValidatorPlugin,
} = require('ecma-version-validator-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'
const isWatch = process.env.WATCH === 'true'

/**
 * This is a base webpack config that is used for all generic web packages.
 * It should contain the same support as analytics.js (e.g. es5, minified, etc)
 *
 *
 * @type { import('webpack').Configuration }
 */
module.exports = {
  devtool: 'source-map',
  stats: isWatch ? 'errors-warnings' : 'normal',
  mode: isProd ? 'production' : 'development',
  target: ['web', 'es5'], // target es5 for ie11 support (generates module boilerplate in es5)
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-typescript'],
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      ie: 11,
                    },
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          // not sure why, if we target es5, we  can set ecma to 2015 here without breaking ie11.
          // this from the original webpack config had that netto set up, so leaving it as is.
          ecma: '2015',
          mangle: true,
          compress: true,
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CircularDependencyPlugin({
      failOnError: true,
    }),
    new ECMAVersionValidatorPlugin({ ecmaVersion: 5 }), // ensure we don't accidentally break ie11 syntax.
  ],
}
