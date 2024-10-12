const esbuild = require('esbuild')
const outfile = './dist/global/index.js'
esbuild
  .build({
    entryPoints: ['./src/index.global.ts'],
    outfile: outfile,
    bundle: true,
    minify: true,
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .then(() => {
    console.log(`wrote: ${outfile}`)
  })
