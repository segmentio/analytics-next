const esbuild = require('esbuild')

/**
 * @param {string} type - The type of build, either 'mobile' or 'web'.
 */
async function build(type) {
  const outfileMinified = `./dist/global/index.${type}.min.js`
  const outfileUnminified = `./dist/global/index.${type}.js`
  try {
    // Build minified version
    await esbuild.build({
      entryPoints: [`./src/${type}/index.global.ts`],
      outfile: outfileMinified,
      bundle: true,
      minify: true,
    })
    console.log(`wrote: ${outfileMinified}`)

    // Build unminified version
    await esbuild.build({
      entryPoints: [`./src/${type}/index.global.ts`],
      outfile: outfileUnminified,
      bundle: true,
      minify: false,
    })
    console.log(`wrote: ${outfileUnminified}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

build('mobile')
build('web')
