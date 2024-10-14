const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises
const pkgJSON = require('./package.json')

const getBanner = (entryPoint) => {
  const content = [
    `// Generated in: ${pkgJSON.name}@${pkgJSON.version}`,
    `// Entry point: ${entryPoint}`,
  ].join('\n')
  return content
}

const entryPoints = {
  mobile: './src/mobile/index.signals-runtime.ts',
  web: './src/web/index.signals-runtime.ts',
}

async function prependContent(filePath, content) {
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8')
    await fsPromises.writeFile(filePath, content + '\n' + fileContent)
  } catch (error) {
    console.error(`Error prepending generated content: ${error}`)
  }
}
const buildRuntimeAsString = async (type) => {
  const banner = getBanner(entryPoints[type])
  const outHelperFileUnminified = `./dist/global/index.${type}.js`

  const runtimeContent = fs
    .readFileSync(outHelperFileUnminified, 'utf-8')
    .replace(banner, '') // remove banner from code section
  const generatedDir = path.resolve(__dirname, `src/${type}`)
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true })
  }

  // Create the TypeScript file with the inlined string
  const generatedTsFile = `./src/${type}/get-runtime-string.ts`
  const tsFileContent = `export const RuntimeString = \`${runtimeContent}\``

  fs.writeFileSync(generatedTsFile, tsFileContent)
  // add banner back to top
  await prependContent(
    generatedTsFile,
    ['/* eslint-disable */', banner].join('\n')
  )
  console.log(`wrote: ${generatedTsFile}`)
}

const buildAll = async () => {
  for (const [type, entryPoint] of Object.entries(entryPoints)) {
    const outfileMinified = `./dist/global/index.${type}.min.js`
    const outfileUnminified = `./dist/global/index.${type}.js`
    try {
      // Build minified version
      await esbuild.build({
        entryPoints: [entryPoint],
        outfile: outfileMinified,
        bundle: true,
        minify: true,
        banner: { js: getBanner(entryPoint) },
      })
      console.log(`wrote: ${outfileMinified}`)

      // Build unminified version
      await esbuild.build({
        entryPoints: [entryPoint],
        outfile: outfileUnminified,
        bundle: true,
        minify: false,
        banner: { js: getBanner(entryPoint) },
      })
      console.log(`wrote: ${outfileUnminified}`)

      await buildRuntimeAsString(type)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
}

buildAll()
