import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: ['@3d-dice/dice-box'], // Не включать в бандл
      output: {
        globals: {
          '@3d-dice/dice-box': 'DiceBox' // Использовать глобальную переменную
        }
      }
    }
  }
})