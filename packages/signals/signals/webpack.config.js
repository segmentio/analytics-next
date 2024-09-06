const common = require('@internal/config-webpack/webpack.config.common')
const path = require('path')
const { merge } = require('webpack-merge')
const isProd = process.env.NODE_ENV === 'production'
/**
 * @type { import('webpack').Configuration }
 */
module.exports = merge(common, {
  entry: {
    'analytics-signals.umd': {
      import: path.resolve(__dirname, 'src/index.umd.ts'),
      library: {
        name: 'AnalyticsBrowserSignals',
        type: 'umd',
      },
    },
    'analytics-signals.global': {
      import: path.resolve(__dirname, 'src/index.ts'),
      library: {
        type: 'window',
      },
    },
  },
  output: {
    filename: isProd ? '[name].js' : '[name].development.js',
    path: path.resolve(__dirname, 'dist/umd'),
    chunkFilename: isProd
      ? '[name].[contenthash].js'
      : '[name].chunk.development.js',
  },
})
