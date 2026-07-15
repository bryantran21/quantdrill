/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves from /<repo>/, so the deploy workflow sets GITHUB_PAGES
// to build with that base. Everywhere else (Vercel, local, preview) serves from
// the domain root, so base stays '/'.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/quantdrill/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
