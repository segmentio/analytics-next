const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises
const babel = require('esbuild-plugin-babel-cjs')

const getBanner = (entryPoint) => {
  const content = [
    `// GENERATED, DO NOT EDIT`,
    `// Entry point: ${entryPoint}`,
  ].join('\n')
  return content
}

/**
 *
 * @param {"web" | "mobile"} platform
 */
const getEntryPoint = (platform) => {
  return `src/${platform}/index.signals-runtime.ts`
}

const getOutFiles = (platform) => {
  const outfileMinified = `./dist/runtime/index.${platform}.min.js`
  const outfileUnminified = `./dist/runtime/index.${platform}.js`
  return {
    outfileMinified,
    outfileUnminified,
  }
}

async function prependContent(filePath, content) {
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8')
    await fsPromises.writeFile(filePath, content + '\n' + fileContent)
  } catch (error) {
    console.error(`Error prepending generated content: ${error}`)
  }
}

const buildRuntimeAsString = async (platform) => {
  const banner = getBanner(getEntryPoint(platform))
  const { outfileMinified } = getOutFiles(platform)

  const runtimeContent = fs
    .readFileSync(outfileMinified, 'utf-8')
    .replace(banner, '') // remove existing banner from code section to be added back later
  const generatedDir = path.resolve(__dirname, `src/${platform}`)
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true })
  }

  const generatedTsFile = `./src/${platform}/get-runtime-code.generated.ts`
  const tsFileContent = `export const getRuntimeCode = (): string => \`${runtimeContent}\`
  `

  fs.writeFileSync(generatedTsFile, tsFileContent)

  // add back banner
  await prependContent(
    generatedTsFile,
    ['/* eslint-disable */', banner].join('\n')
  )
  console.log(`wrote: ${generatedTsFile}`)
}

const buildRuntime = async (platform) => {
  const entryPoint = getEntryPoint(platform)
  const { outfileUnminified, outfileMinified } = getOutFiles(platform)

  // Transpile with Babel
  const transpiledFile = `./dist/runtime/index.${platform}.transpiled.js`
  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: transpiledFile,
    bundle: true,
    minify: false,
    plugins: [
      babel({
        config: {
          presets: ['@babel/preset-env', '@babel/preset-typescript'],
        },
      }),
    ],
  })

  // Bundle and minify with esbuild
  await esbuild.build({
    entryPoints: [transpiledFile],
    outfile: outfileMinified,
    bundle: true,
    minify: true,
    banner: { js: getBanner(entryPoint) },
  })
  console.log(`wrote: ${outfileMinified}`)

  // Bundle without minification
  await esbuild.build({
    entryPoints: [transpiledFile],
    outfile: outfileUnminified,
    bundle: true,
    minify: false,
    banner: { js: getBanner(entryPoint) },
  })
  console.log(`wrote: ${outfileUnminified}`)
}

const buildAll = async () => {
  const PLATFORMS = ['web', 'mobile']
  for (const platform of PLATFORMS) {
    try {
      await buildRuntime(platform)
      await buildRuntimeAsString(platform)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
}

buildAll()
