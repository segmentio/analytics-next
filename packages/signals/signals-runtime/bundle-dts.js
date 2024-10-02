const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function prependGenerated(filePath) {
  const content = [
    '// @ts-nocheck',
    '// prettier-ignore',
    '/* eslint-disable */',
    '\n',
  ].join('\n')
  if (!fs.existsSync(filePath) || !content) {
    return console.error('cannot prepend, invalid args.')
  }
  const fileContent = fs.readFileSync(filePath, 'utf8')
  fs.writeFileSync(filePath, content + fileContent)
}

function appendFileContents(targetFilePath, sourceFilePath) {
  const sourceContent = fs.readFileSync(sourceFilePath, { encoding: 'utf-8' })
  fs.appendFileSync(targetFilePath, `\n\n${sourceContent}`, {
    encoding: 'utf-8',
  })
}

function removeExport(filePath) {
  console.log(`Cleaning up ${filePath}...`)
  const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
  // remove export declarations and non-interface/type exports
  const processedContent = data
    .split('\n')
    .filter((line) => {
      // Remove export declarations
      if (line.trim().startsWith('export ')) {
        // Keep only interface and type exports
        return line.includes('interface') || line.includes('type')
      }
      return true
    })
    .map((line) => {
      // Remove the 'export' keyword
      return line.replace('export ', '')
    })
    .join('\n')

  fs.writeFileSync(filePath, processedContent, { encoding: 'utf-8' })
}

const outFile = `generated/web.d.ts`
const command = `yarn dts-bundle-generator -o ${outFile} src/web-exports.ts --no-check --inline-declare-global --inline-declare-externals`
execSync(command, { stdio: 'inherit' })
// Example usage of processTSFile function
const tsFilePath = path.join(__dirname, outFile)
removeExport(tsFilePath)
prependGenerated(tsFilePath)

// Append the contents of web-exports-globals.ts
const globalsFilePath = path.join(__dirname, 'src/web-exports-globals.ts')
appendFileContents(tsFilePath, globalsFilePath)
