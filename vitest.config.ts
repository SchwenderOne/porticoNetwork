import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./client/src', import.meta.url)) + '/' },
      { find: '@shared', replacement: fileURLToPath(new URL('./shared', import.meta.url)) + '/' },
      { find: '@assets', replacement: fileURLToPath(new URL('./attached_assets', import.meta.url)) + '/' },
    ],
  },
  plugins: [react()],
}) 