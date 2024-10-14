/* eslint-disable no-undef */
const { execSync } = require('child_process')
const fsPromises = require('fs').promises
const pkgJSON = require('./package.json')
async function prependGenerated(filePath) {
  const content = [
    '/* eslint-disable */',
    '// These types will be used in the segment app UI for autocomplete',
    `// Generated from: ${pkgJSON.name}@${pkgJSON.version}`,
    '\n',
  ].join('\n')
  try {
    const fileContent = await fsPromises.readFile(filePath, 'utf8')
    await fsPromises.writeFile(filePath, content + fileContent)
  } catch (error) {
    console.error(`Error prepending generated content: ${error}`)
  }
}

async function removeImportExport(filePath) {
  const data = await fsPromises.readFile(filePath, { encoding: 'utf-8' })

  await fsPromises.writeFile(filePath, data, {
    encoding: 'utf-8',
  })
}

const main = async () => {
  execSync('yarn build:esm', { stdio: 'inherit' })
  // eslint-disable-next-line no-undef
  execSync('npx api-extractor run --config ./api-extractor.mobile.json --local')
  execSync('npx api-extractor run --config ./api-extractor.web.json --local')
  const outputs = ['./editor/web-exports.d.ts', './editor/mobile-exports.d.ts']
  await Promise.all(outputs.map(prependGenerated))
  await Promise.all(outputs.map(removeImportExport))
}
main()
