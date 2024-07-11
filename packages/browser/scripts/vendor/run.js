/**
 * This file:
 * - uses webpack to build tsub.js
 * - converts tsub.js to tsub.ts, appends comments, and moves it into the source directory
 */
const { execSync } = require('node:child_process')
const path = require('node:path')

const { createTSFromJSLib } = require('./helpers')
const configPath = 'scripts/vendor/webpack.config.vendor.js'

execSync(`yarn webpack --config ${configPath}`, { stdio: 'inherit' })

const tsubInputBundlePath = path.join(__dirname, 'dist.vendor', 'tsub.js')
const tsubOutputVendorDir = 'src/vendor/tsub'
createTSFromJSLib(tsubInputBundlePath, tsubOutputVendorDir, {
  libraryName: '@segment/tsub',
})
