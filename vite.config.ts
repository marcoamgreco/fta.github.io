import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/fta.github.io/', // Para GitHub Pages - ajuste conforme o nome do repositório
})
