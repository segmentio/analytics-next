#!/usr/bin/env node

const webpack = require('webpack')
const { outputFile } = require('./helpers')
const path = require('path')

const config = require('./webpack.config.vendor')

webpack(config, (err, stats) => {
  if (err) {
    console.error(err.stack || err)
    if (err.details) {
      console.error(err.details)
    }
    return
  }

  console.log(
    stats.toString({
      colors: true,
    })
  )

  // Write the license file
  const licenseFile = path.resolve(__dirname, '../../src/vendor/tsub/tsub.js.LICENSE.txt')
  const licenseContents = stats.compilation.assets['tsub.js.LICENSE.txt'].source()
  outputFile(licenseFile, licenseContents)
}) 