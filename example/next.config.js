const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE,
})

module.exports = withBundleAnalyzer({
  webpack: (config) => {
    if (config.mode === 'development') {
      config.module.rules.push({
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      })
      if (!Array.isArray(config.ignoreWarnings)) {
        config.ignoreWarnings = []
      }

      config.ignoreWarnings.push(/Failed to parse source map/)
    }

    return config
  },
})
