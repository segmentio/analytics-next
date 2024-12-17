const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CircularDependencyPlugin = require('circular-dependency-plugin')

const isProd = process.env.NODE_ENV === 'production'

const ASSET_PATH = process.env.ASSET_PATH
  ? process.env.ASSET_PATH
  : !isProd
  ? '/dist/umd/'
  : ''

const envPluginConfig = {
  ASSET_PATH: ASSET_PATH,
  IS_WEBPACK_BUILD: true,
}

console.log('Running Webpack Build', {
  NODE_ENV: process.env.NODE_ENV,
  'Webpack Environment Plugin': envPluginConfig,
})

const plugins = [
  new CompressionPlugin({}),
  new webpack.EnvironmentPlugin(envPluginConfig),
  new CircularDependencyPlugin({
    failOnError: true,
  }),
]

if (process.env.ANALYZE) {
  plugins.push(new BundleAnalyzerPlugin())
}

/** @type { import('webpack').Configuration } */
const config = {
  stats: process.env.WATCH === 'true' ? 'errors-warnings' : 'minimal',
  node: {
    global: false, // do not polyfill global object, we can use getGlobal function if needed.
  },
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  entry: {
    index: {
      import: path.resolve(__dirname, 'src/browser/browser-umd.ts'),
      library: {
        name: 'AnalyticsNext',
        type: 'umd',
      },
    },
    standalone: {
      import: path.resolve(__dirname, 'src/browser/standalone.ts'),
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
