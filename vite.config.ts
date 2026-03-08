import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@api': '/src/api',
      '@components': '/src/components',
      '@screens': '/src/screens',
      '@store': '/src/store',
      '@types': '/src/types',
      '@hooks': '/src/hooks',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          if (id.includes('node_modules/appwrite')) {
            return 'appwrite';
          }
          if (id.includes('node_modules/zustand')) {
            return 'zustand';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
  },
});
