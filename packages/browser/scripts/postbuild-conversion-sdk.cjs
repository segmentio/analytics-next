const fs = require('fs')
const path = require('path')

const distDir = path.resolve(__dirname, '../dist/umd')
const minBundle = path.join(distDir, 'conversion-analytics.build.min.js')
const sdkAlias = path.join(distDir, 'sdk.min.js')

if (!fs.existsSync(minBundle)) {
  console.error(
    'Missing conversion SDK bundle. Run: NODE_ENV=production yarn build:conversion-sdk'
  )
  process.exit(1)
}

fs.copyFileSync(minBundle, sdkAlias)
console.log(`Copied ${path.basename(minBundle)} -> ${path.basename(sdkAlias)}`)
