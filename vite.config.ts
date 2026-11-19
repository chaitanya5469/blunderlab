import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = dirname(fileURLToPath(import.meta.url));

/** Single-threaded lite WASM build: no SharedArrayBuffer / COOP+COEP headers needed. */
const ENGINE_FILES = ['stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm'];

/**
 * Copies the Stockfish engine from node_modules into public/engine so it is served
 * as a static file (dev, build and inside a Capacitor WebView) and loaded as a Worker.
 */
function stockfishEngine(): Plugin {
  return {
    name: 'blunderlab:copy-stockfish',
    buildStart() {
      const srcDir = join(root, 'node_modules', 'stockfish', 'bin');
      const outDir = join(root, 'public', 'engine');
      mkdirSync(outDir, { recursive: true });
      for (const file of ENGINE_FILES) {
        const src = join(srcDir, file);
        const dest = join(outDir, file);
        if (!existsSync(src)) throw new Error(`Stockfish build file missing: ${src}`);
        if (!existsSync(dest) || statSync(dest).size !== statSync(src).size) copyFileSync(src, dest);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [stockfishEngine(), react(), tailwindcss()],
  // Served from local files inside the app bundle, so one ~600 kB core chunk is fine.
  build: { chunkSizeWarningLimit: 800 },
});
