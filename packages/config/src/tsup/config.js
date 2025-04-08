const { defineConfig } = require('tsup')

module.exports = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
    entry: 'src/index.ts',
  },
  outDir: 'dist',
  clean: true,
})
