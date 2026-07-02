import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/background.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'src/background/background.js';
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        format: 'es'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
