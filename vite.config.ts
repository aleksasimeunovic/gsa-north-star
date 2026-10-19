/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set to the GitHub repository name before deploying (Phase 7).
export default defineConfig({
  base: '/gsa-north-star/',
  plugins: [react()],
  test: { include: ['src/logic/**/*.test.ts'] },
})
