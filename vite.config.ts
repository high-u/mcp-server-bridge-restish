import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Read the source file to check if it already has a shebang
const sourceContent = fs.readFileSync(resolve(__dirname, 'src/index.ts'), 'utf-8');
const hasBanner = sourceContent.startsWith('#!/usr/bin/env node');

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['effect', '@valibot/to-json-schema', 'fastmcp', 'zod'],
      output: {
        // Only add banner if the source doesn't already have it
        ...(hasBanner ? {} : { banner: '#!/usr/bin/env node' }),
      }
    },
    target: 'node18',
    sourcemap: true,
    minify: false,
  },
});
