const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const bodyParser = require('body-parser')

/**
 * This is a base webpack config that is used for all generic web packages.
 * It should contain the same support as analytics.js (e.g. es5, minified, etc)
 *
 *
 * @type { import('webpack').Configuration }
 */

module.exports = {
  entry: './src/index.tsx',
  devtool: 'source-map',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new Dotenv(),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: false,
    onBeforeSetupMiddleware(devServer) {
      devServer.app.use(bodyParser.json())
      devServer.app.post('/parrot', (req, res) => {
        console.log(req.body)
        res.json(req.body)
      })
    },
    historyApiFallback: true,
  },
}
