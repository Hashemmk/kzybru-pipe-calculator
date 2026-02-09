import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/kzybru-pipe-calculator/',
  plugins: [react()],
  root: '.',
  server: {
    port: 3000,
    open: false,
    strictPort: false,
    middlewareMode: false
  }
})
