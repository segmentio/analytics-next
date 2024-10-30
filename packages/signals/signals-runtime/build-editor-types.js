/* eslint-disable no-undef */
const { execSync } = require('child_process')
const fsPromises = require('fs').promises
const pkgJSON = require('./package.json')
async function prependGenerated(filePath) {
  const content = [
    '/* eslint-disable */',
    '// These types will be used in the segment app UI for autocomplete',
    `// Generated from: ${pkgJSON.name}@${pkgJSON.version}`,
    '// Built as text so they do not cause global scope pollution for packages importing unrelated modules',
    '\n',
  ].join('\n')
  try {
    const fileContent = await fsPromises.readFile(filePath, 'utf8')
    await fsPromises.writeFile(filePath, content + fileContent)
  } catch (error) {
    console.error(`Error prepending generated content: ${error}`)
  }
}

async function removeExports(filePath) {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8')
    // Remove 'export { }' lines and any instance of the word 'export'
    let result = data
      .split('\n')
      .filter((line) => line.trim() !== 'export { }') // Remove lines that are exactly 'export { }'
      .map((line) => line.replace(/\bexport\b/g, '')) // Remove any instance of the word 'export'
      .join('\n')
    await fsPromises.writeFile(filePath, result, 'utf8')
  } catch (error) {
    console.error(`Error exports: ${error}`)
  }
}

const main = async () => {
  execSync('yarn build:esm', { stdio: 'inherit' })
  execSync('npx api-extractor run --config ./api-extractor.mobile.json --local')
  execSync('npx api-extractor run --config ./api-extractor.web.json --local')
  const outputs = [
    './dist/editor/web-editor.d.ts.txt',
    './dist/editor/mobile-editor.d.ts.txt',
  ]
  await Promise.all(outputs.map(removeExports))
  await Promise.all(outputs.map(prependGenerated))
  console.log('wrote:', outputs.join(', '))
}
main()
