const esbuild = require('esbuild')

const pkgJSON = require('./package.json')
const getBanner = (entryPoint) => {
  const content = [
    `// Generated in: ${pkgJSON.name}@${pkgJSON.version}`,
    `// Entry point: ${entryPoint}`,
  ].join('\n')
  return content
}
const entryPoints = {
  mobile: './src/mobile/index.global.ts',
  web: './src/web/index.global.ts',
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
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
}

buildAll()
