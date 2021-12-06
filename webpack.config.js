const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin

const isProd = process.env.NODE_ENV === 'production'
const ASSET_PATH = isProd
  ? 'https://cdn.segment.com/analytics-next/bundles/'
  : '/dist/umd/'

const plugins = [
  new CompressionPlugin({}),
  new webpack.EnvironmentPlugin({
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
    index: {
      import: path.resolve(__dirname, 'src/browser-umd.ts'),
      library: {
        name: 'AnalyticsNext',
        type: 'umd',
      },
    },
    standalone: {
      import: path.resolve(__dirname, 'src/standalone.ts'),
      library: {
        name: 'AnalyticsNext',
        type: 'window',
      },
    },
  },
  output: {
    publicPath: '', // Hack - we're overriding publicPath but IE needs this set or it won't load.
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/umd'),
    chunkFilename: '[name].bundle.[contenthash].js',
  },
  target: ['web', 'es5'],
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
    moduleIds: 'deterministic',
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
