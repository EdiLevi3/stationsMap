// Vite config — React plugin + Vitest settings for unit tests

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',    // simulate browser DOM for component tests
    globals: true,            // allow describe/it/expect without imports
    setupFiles: './src/test/setup.js',
  },
})
