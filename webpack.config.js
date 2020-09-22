const path = require('path')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    analytics: path.resolve(__dirname, 'src/index.ts'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'analytics',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: isProd,
  },
  plugins: [new BundleAnalyzerPlugin()],
}
