const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
const { version } = require('./package.json')

const isProd = process.env.NODE_ENV === 'production'
const ASSET_PATH = isProd
  ? 'https://cdn.segment.com/analytics-next/bundles/'
  : '/dist/umd/'

const plugins = [
  new CompressionPlugin({
    cache: true,
  }),
  new webpack.EnvironmentPlugin({
    LEGACY_INTEGRATIONS_PATH: 'https://cdn.segment.com/next-integrations',
    DEBUG: false,
    VERSION: version,
    ASSET_PATH,
  }),
]

if (process.env.ANALYZE) {
  plugins.push(new BundleAnalyzerPlugin())
}

const config = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  entry: {
    index: path.resolve(__dirname, 'src/browser.ts'),
    standalone: path.resolve(__dirname, 'src/standalone.ts'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/umd'),
    chunkFilename: '[name].bundle.[contenthash].js',
    library: 'AnalyticsNext',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
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
  devServer: {
    contentBase: path.resolve(__dirname, 'dist/umd'),
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
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
  plugins,
}

module.exports = config
