const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')

const isProd = process.env.NODE_ENV === 'production'
const includeGpt = process.env.CONVERSION_INCLUDE_GPT === '1'

/** @type { import('webpack').Configuration } */
const config = {
  stats: process.env.WATCH === 'true' ? 'errors-warnings' : 'minimal',
  mode: process.env.NODE_ENV || 'development',
  devtool: isProd ? false : 'source-map',
  entry: {
    'conversion-analytics.build': path.resolve(
      __dirname,
      'src/conversion-sdk/browser-entry.ts'
    ),
  },
  output: {
    filename: isProd
      ? 'conversion-analytics.build.min.js'
      : 'conversion-analytics.build.js',
    path: path.resolve(__dirname, 'dist/umd'),
    clean: false,
  },
  target: ['web', 'es2017'],
  node: {
    global: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.json',
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: isProd,
    minimizer: isProd
      ? [
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              ecma: 2017,
              mangle: true,
              compress: true,
              output: {
                comments: false,
              },
            },
          }),
        ]
      : [],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      IS_WEBPACK_BUILD: true,
    }),
    new CircularDependencyPlugin({
      failOnError: true,
    }),
    ...(includeGpt
      ? []
      : [
          new webpack.NormalModuleReplacementPlugin(
            /conversion-sdk[\\/]gpt-plugin(\.ts)?$/,
            path.resolve(__dirname, 'src/conversion-sdk/stubs/gpt-stub.ts')
          ),
        ]),
    ...(isProd ? [new CompressionPlugin({})] : []),
  ],
}

module.exports = config
