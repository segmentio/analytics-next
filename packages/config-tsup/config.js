const { defineConfig } = require('tsup')

module.exports = defineConfig(() => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // Output both ESM and CJS formats
  dts: {
    resolve: true,
    entry: 'src/index.ts',
  },
  clean: true,
  esbuildOptions(options, context) {
    if (context.format === 'esm') {
      options.outdir = 'dist/esm' // Output ESM files to dist/esm
      options.outExtension = { '.js': '.mjs' } // Use .mjs for ESM files
    } else if (context.format === 'cjs') {
      options.outdir = 'dist/cjs' // Output CJS files to dist/cjs
    }
  },
}))
