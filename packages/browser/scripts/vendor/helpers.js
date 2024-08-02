const fs = require('node:fs')
const path = require('node:path')

function prependToFile(filePath, content) {
  const fileContent = fs.readFileSync(filePath, 'utf8')
  fs.writeFileSync(filePath, content + fileContent)
}

function createTSFromJSLib(inputFilePath, outputDir, { libraryName }) {
  const fileName = path.basename(inputFilePath, '.js') + '.ts'
  const outputFilePath = path.join(outputDir, fileName)
  const libVersion = require(`${libraryName}/package.json`).version
  const tsContent = [
    '// @ts-nocheck',
    '// prettier-ignore',
    '/* eslint-disable */',
    `// ${libraryName} ${libVersion} - GENERATED DO NOT MODIFY`,
    '\n',
  ].join('\n')
  fs.renameSync(inputFilePath, outputFilePath)
  prependToFile(outputFilePath, tsContent)
  console.log(
    `\n Built ${libraryName} ${libVersion} -> output ${outputFilePath}`
  )
  return { outputFilePath }
}

module.exports = {
  prependToFile,
  createTSFromJSLib,
}
