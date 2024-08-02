import path from 'path'
import globby from 'globby'
import type { Configuration as WebpackConfiguration } from 'webpack'

// This config is for bundling fixtures in order to serve the pages that webdriver.io will use in its tests.
const files = globby.sync('src/tests/*/signals-bundle.ts', { cwd: __dirname })

const entries = files.reduce((acc, file) => {
  const [dirName] = file.split('/').slice(-2)
  const base = path.basename(dirName)
  return {
    ...acc,
    [base]: path.resolve(__dirname, file),
  }
}, {})

const config: WebpackConfiguration = {
  mode: 'development',
  devtool: 'source-map',
  entry: entries,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[name].chunk.js',
    clean: true,
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
              configFile: 'tsconfig.json',
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
}

export default config
