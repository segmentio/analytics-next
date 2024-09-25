const fs = require('fs')
const esbuild = require('esbuild')
const path = require('path')

// Note: This was adopted from the https://github.com/markwylde/workerbox/blob/master/build.js
console.log('Building workerbox...')

const DEBUG = process.env.DEBUG === 'true'
if (DEBUG) console.log('Minification off.')

async function writeFileWithDirs(filePath, data) {
  // Extract the directory path from the file path
  const dir = path.dirname(filePath)

  // Ensure the directory exists
  await fs.promises.mkdir(dir, { recursive: true })

  // Write the file
  await fs.promises.writeFile(filePath, data, 'utf8')
}

async function build() {
  console.log(new Date(), 'rebuilding...')

  // clean up dist folder
  await fs.promises.rm('./src/lib/workerbox/dist', {
    recursive: true,
    force: true,
  })

  await esbuild.build({
    entryPoints: ['./src/lib/workerbox/worker.ts'],
    bundle: true,
    outfile: './src/lib/workerbox/dist/worker.js',
    minify: !DEBUG,
  })

  const jsData = await fs.promises.readFile(
    './src/lib/workerbox/dist/worker.js',
    'utf8'
  )

  const TEMPLATE_PLACEHOLDER = `{{WORKERSCRIPT}}`
  const htmlData = (
    await fs.promises.readFile('./src/lib/workerbox/worker.html', 'utf8')
  ).replace(TEMPLATE_PLACEHOLDER, jsData)

  await writeFileWithDirs('./src/lib/workerbox/dist/worker.html', htmlData)
  await writeFileWithDirs(
    './src/lib/workerbox/worker.generated.ts',
    [
      '/* eslint-disable */',
      `// built from /dist/worker.html`,
      `export default atob('${Buffer.from(htmlData).toString('base64')}');`,
    ].join('\n')
  )
}

build()
  .then(() => console.log('Build successful'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
