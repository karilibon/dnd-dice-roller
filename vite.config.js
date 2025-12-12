import { defineConfig } from 'vite'

export default defineConfig({
  base: '/dnd-dice-roller/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})