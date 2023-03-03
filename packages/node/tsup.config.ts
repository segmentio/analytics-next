import { defineConfig } from 'tsup'

export const tsup = defineConfig({
  format: ['esm'],
  entry: ['src/index.ts'],
  outDir: './dist',
  clean: true,
  splitting: true,
})
