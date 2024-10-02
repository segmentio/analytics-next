const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function prependGenerated(filePath) {
  const content = [
    '/* These types will be used in the segment app UI for autocomplete */',
    '\n',
  ].join('\n')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  fs.writeFileSync(filePath, content + fileContent)
}

function appendFileContents(targetFilePath, sourceFilePath, divider = '\n') {
  const sourceContent = fs.readFileSync(sourceFilePath, { encoding: 'utf-8' })
  const newContent = `${divider}${sourceContent}`
  fs.appendFileSync(targetFilePath, newContent, {
    encoding: 'utf-8',
  })
}

function removeExport(filePath) {
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

/**
 * Filters the lines of a file based on a callback function and writes the processed content back to the file.
 *
 * @param {string} filePath - The path to the file to be processed.
 * @param {(line: string) => boolean} cb - A callback function that takes a line as input and returns a boolean indicating whether the line should be kept.
 */
function filterLines(filePath, cb) {
  const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const processedContent = data
    .split('\n')
    .filter((line) => cb(line))
    .join('\n')

  fs.writeFileSync(filePath, processedContent, { encoding: 'utf-8' })
}

const main = () => {
  const outFile = `dist/web.d.ts`
  const command = `yarn dts-bundle-generator -o ${outFile} src/web-exports.ts --no-check`
  execSync(command, { stdio: 'inherit' })
  const outFileAbs = path.join(__dirname, outFile)
  removeExport(outFileAbs)

  // Prepend ignore artifactions
  prependGenerated(outFileAbs)

  // Append the contents of web-exports-globals.ts
  const globalsFilePath = path.join(__dirname, 'src/web-exports-globals.ts')
  appendFileContents(outFileAbs, globalsFilePath)
  // remove any comments that use // like ts-ignore, ts-nocheck etc (/* */ is OK)
  filterLines(outFileAbs, (line) => !line.startsWith('//'))
}

main()
