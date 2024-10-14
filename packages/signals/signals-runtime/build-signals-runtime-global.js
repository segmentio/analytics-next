const esbuild = require('esbuild')

const pkgJSON = require('./package.json')
const getBanner = (entryPoint) => {
  const content = [
    `// Generated in: ${pkgJSON.name}@${pkgJSON.version}`,
    `// Entry point: ${entryPoint}`,
  ].join('\n')
  return content
}

/**
 * @param {string} type - The type of build, either 'mobile' or 'web'.
 */
async function build(type) {
  const entryPoint = `./src/${type}/index.global.ts`
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

build('mobile')
build('web')
