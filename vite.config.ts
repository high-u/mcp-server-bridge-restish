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
      // Node.js組み込みモジュールのみ外部化
      external: [
        'node:buffer', 'node:crypto', 'node:events', 'node:fs', 'node:http', 'node:https', 'node:net',
        'node:os', 'node:path', 'node:stream', 'node:string_decoder', 'node:url', 'node:util', 'node:zlib',
        'node:diagnostics_channel', 'diagnostics_channel', 'node:http2', 'http2', 'node:async_hooks', 'async_hooks',
        'fs', 'path', 'os', 'crypto', 'stream', 'util', 'events', 'http', 'https', 'net', 'zlib',
        'url', 'string_decoder', 'buffer', 'timers/promises', 'fs/promises'
      ],
      output: {
        // Only add banner if the source doesn't already have it
        ...(hasBanner ? {} : { banner: '#!/usr/bin/env node' }),
      }
    },
    target: 'node18',
    sourcemap: true,
    minify: false,
  },
  // SSRオプションを追加してNode.js環境向けに最適化
  ssr: {
    // Node.jsモジュールの解決を適切に処理
    noExternal: ['fastmcp', 'zod']
  }
});
