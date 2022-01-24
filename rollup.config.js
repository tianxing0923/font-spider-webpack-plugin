import rollupTypescript from '@rollup/plugin-typescript'

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist/cjs/main.js',
      format: 'cjs',
      exports: 'auto'
    },
    {
      file: 'dist/es/main.js',
      format: 'es',
      exports: 'auto'
    },
  ],
  external: ['webpack', 'font-spider', 'schema-utils', 'fs', 'path', 'chalk', 'cheerio'],
  plugins: [
    rollupTypescript({
      tsconfig: './tsconfig.json',
    }),
  ],
}

export default config
