import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./client', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)) + '/',
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)) + '/',
      '@assets': fileURLToPath(new URL('./attached_assets', import.meta.url)) + '/',
    },
  },
  plugins: [
    react(),
  ],
  build: {
    outDir: fileURLToPath(new URL('./dist/public', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5000,
  },
});
