/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Set to the GitHub repository name before deploying (Phase 7).
export default defineConfig({
  base: '/gsa-north-star/',
  plugins: [react(), tailwindcss()],
  test: { include: ['src/logic/**/*.test.ts'] },
})
