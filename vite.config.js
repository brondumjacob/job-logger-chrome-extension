import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        background: resolve(__dirname, 'src/background/background.js'),
        content: resolve(__dirname, 'src/content/content.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'src/background/[name].js';
          if (chunkInfo.name === 'content') return 'src/content/[name].js';
          return 'assets/[name]-[hash].js';
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
