const common = require('@internal/config-webpack/webpack.config.common')
const path = require('path')
const { merge } = require('webpack-merge')
const isProd = process.env.NODE_ENV === 'production'
/**
 * @type { import('webpack').Configuration }
 */
module.exports = merge(common, {
  entry: {
    'analytics-onetrust.umd': {
      import: path.resolve(__dirname, 'src/index.umd.ts'),
      library: {
        name: 'AnalyticsOneTrust',
        type: 'umd',
      },
    },
    'analytics-onetrust': {
      import: path.resolve(__dirname, 'src/index.ts'),
      library: {
        // no name, attach everything exported to global scope
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
