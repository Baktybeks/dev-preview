import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
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
});
