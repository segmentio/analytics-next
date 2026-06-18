const fs = require('fs')
const path = require('path')

const distDir = path.resolve(__dirname, '../dist/umd')
const scriptDir = path.resolve(__dirname, '../../../script')
const e2eSdkDir = path.resolve(
  __dirname,
  '../../browser-integration-tests/conversion-sdk'
)

const copies = [
  ['sdk.min.js', 'sdk.min.js'],
  ['conversion-analytics.build.min.js', 'conversion-analytics.build.min.js'],
  ['conversion-analytics.build.js', 'conversion-analytics.build.js'],
  ['sdk.min.js', 'conversion-analytics-sdk.build.min.js'],
  ['conversion-analytics.build.js', 'conversion-analytics-sdk.build.js'],
]

if (!fs.existsSync(distDir)) {
  console.error('Missing dist/umd. Run yarn build:conversion-sdk first.')
  process.exit(1)
}

fs.mkdirSync(scriptDir, { recursive: true })

for (const entry of fs.readdirSync(scriptDir)) {
  if (entry.endsWith('.js') || entry.endsWith('.map') || entry.endsWith('.gz')) {
    fs.unlinkSync(path.join(scriptDir, entry))
  }
}

let copied = 0
for (const [sourceName, targetName] of copies) {
  const source = path.join(distDir, sourceName)
  if (!fs.existsSync(source)) {
    continue
  }
  fs.copyFileSync(source, path.join(scriptDir, targetName))
  copied += 1
}

if (copied === 0) {
  console.error('No bundles found in dist/umd to sync.')
  process.exit(1)
}

const e2eSdk = path.join(distDir, 'sdk.min.js')
if (fs.existsSync(e2eSdk)) {
  fs.mkdirSync(e2eSdkDir, { recursive: true })
  fs.copyFileSync(e2eSdk, path.join(e2eSdkDir, 'sdk.min.js'))
  copied += 1
}

console.log(`Synced ${copied} file(s) to ${scriptDir} (+ E2E conversion-sdk)`)
