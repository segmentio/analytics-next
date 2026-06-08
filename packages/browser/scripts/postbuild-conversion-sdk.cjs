const crypto = require('crypto')
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

const content = fs.readFileSync(minBundle)
const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8)
const hashedBundle = path.join(distDir, `sdk.${hash}.min.js`)

fs.copyFileSync(minBundle, sdkAlias)
fs.copyFileSync(minBundle, hashedBundle)
console.log(
  `Copied ${path.basename(minBundle)} -> ${path.basename(sdkAlias)} and ${path.basename(hashedBundle)}`
)
