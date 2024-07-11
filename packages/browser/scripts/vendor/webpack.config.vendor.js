const path = require('node:path')

/** @type { import('webpack').Configuration } */
module.exports = {
  entry: require.resolve('@segment/tsub'),
  output: {
    path: path.resolve(__dirname, 'dist.vendor'), // Output directory
    filename: 'tsub.js',
    library: {
      type: 'umd',
    },
  },
  resolve: {
    extensions: ['.js'], // Resolve these extensions
  },
  mode: 'production', // Use production mode for minification, etc.
}
