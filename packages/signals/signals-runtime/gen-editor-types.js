const { exec } = require('child_process')
const path = require('path')
const fsPromises = require('fs').promises
const util = require('util')
const execAsync = util.promisify(exec)

async function prependGenerated(filePath) {
  const content = [
    '/* These types will be used in the segment app UI for autocomplete */',
    '/* eslint-disable */',
    '\n',
  ].join('\n')
  try {
    const fileContent = await fsPromises.readFile(filePath, 'utf8')
    await fsPromises.writeFile(filePath, content + fileContent)
  } catch (error) {
    console.error(`Error prepending generated content: ${error}`)
  }
}

async function appendFileContents(
  targetFilePath,
  sourceFilePath,
  divider = '\n'
) {
  const sourceContent = await fsPromises.readFile(sourceFilePath, {
    encoding: 'utf-8',
  })
  const newContent = `${divider}${sourceContent}`
  await fsPromises.appendFile(targetFilePath, newContent, {
    encoding: 'utf-8',
  })
}

async function removeImportExport(filePath) {
  const data = await fsPromises.readFile(filePath, { encoding: 'utf-8' })
  // remove export declarations and non-interface/type exports
  const processedContent = data
    .split('\n')
    .filter((line) => {
      const l = line.trim()
      // Remove export declarations
      if (l.startsWith('export ')) {
        // Keep only interface and type exports
        return l.includes('interface') || l.includes('type')
      }
      if (l.startsWith('import')) {
        return false
      }
      return true
    })
    .map((line) => {
      // Remove the 'export' keyword
      return line.replace('export ', '')
    })
    .join('\n')

  await fsPromises.writeFile(filePath, processedContent, {
    encoding: 'utf-8',
  })
}

/**
 * Filters the lines of a file based on a callback function and writes the processed content back to the file.
 *
 * @param {string} filePath - The path to the file to be processed.
 * @param {(line: string) => boolean} cb - A callback function that takes a line as input and returns a boolean indicating whether the line should be kept.
 */
async function filterLines(filePath, cb) {
  const data = await fsPromises.readFile(filePath, { encoding: 'utf-8' })
  const processedContent = data
    .split('\n')
    .filter((line) => cb(line))
    .join('\n')

  await fsPromises.writeFile(filePath, processedContent, {
    encoding: 'utf-8',
  })
}
async function generateDtsBundle(outFile, type) {
  const command = `yarn dts-bundle-generator -o ${outFile} src/${type}/${type}-exports.ts --no-check`
  await execAsync(command, { stdio: 'inherit' })
}

const process = async (type) => {
  console.log(`generating ${type} bundle...`)
  const outFile = `dist/editor/${type}-editor.d.ts`
  await generateDtsBundle(outFile, type)
  const outFileAbs = path.join(__dirname, outFile)
  await prependGenerated(outFileAbs)

  // Append the contents of web-exports-globals.ts
  const globalsFilePath = path.join(
    __dirname,
    `src/${type}/${type}-exports-globals.ts`
  )
  await appendFileContents(outFileAbs, globalsFilePath)
  // remove any comments that use // like ts-ignore, ts-nocheck etc (/* */ is OK)
  await filterLines(outFileAbs, (line) => !line.startsWith('//'))
  await removeImportExport(outFileAbs)
}
const main = async () => {
  const id = `Building type bundle`
  console.time(id)
  // eslint-disable-next-line no-undef
  await Promise.all(['web', 'mobile'].map((type) => process(type)))
  console.timeEnd(id)
}

main()
