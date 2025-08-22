/**
 * This file:
 * - uses webpack to build tsub.js
 * - converts tsub.js to tsub.ts, appends comments, and moves it into the source directory
 */
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const { createTSFromJSLib } = require('./helpers')

// build tsub.js with webpack
const configPath = path.join(__dirname, 'webpack.config.vendor.js')
execFileSync('yarn', ['webpack', '--config', configPath], { stdio: 'inherit' })

// create tsub.ts artifact and move to source directory
const tsubInputBundlePath = path.join(__dirname, 'dist.vendor', 'tsub.js')
const tsubOutputVendorDir = 'src/vendor/tsub'
createTSFromJSLib(tsubInputBundlePath, tsubOutputVendorDir, {
  libraryName: '@segment/tsub',
})
