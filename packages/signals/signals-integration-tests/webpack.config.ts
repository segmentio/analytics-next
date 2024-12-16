import path from 'path'
import globby from 'globby'
import type { Configuration as WebpackConfiguration } from 'webpack'

// This config is for bundling fixtures in order to serve the pages that webdriver.io will use in its tests.
const files = globby.sync('src/tests/*/index.bundle.{ts,tsx}', {
  cwd: __dirname,
})

// e.g if file is src/tests/signals-vanilla/index.bundle.ts, then entry is { signals-vanilla: src/tests/signals-vanilla/index.bundle.ts }
const entries = files.reduce((acc, file) => {
  const [dirName] = file.split('/').slice(-2)
  const base = path.basename(dirName)
  return {
    ...acc,
    [base]: path.resolve(__dirname, file),
  }
}, {})

const config: WebpackConfiguration = {
  stats: 'minimal',
  mode: 'production',
  devtool: 'source-map',
  entry: entries,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[name].chunk.js',
    clean: true,
  },
  target: ['web'],
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
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
  },
}

export default config
