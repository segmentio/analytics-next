const esbuild = require('esbuild')

const outfileMinified = './dist/global/index.min.js'
const outfileUnminified = './dist/global/index.js'

async function build() {
  try {
    // Build minified version
    await esbuild.build({
      entryPoints: ['./src/index.global.ts'],
      outfile: outfileMinified,
      bundle: true,
      minify: true,
    })
    console.log(`wrote: ${outfileMinified}`)

    // Build unminified version
    await esbuild.build({
      entryPoints: ['./src/index.global.ts'],
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

build()
