import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// base 對應 GitHub Pages 子路徑：https://<帳號>.github.io/Connetction-Tree/
export default defineConfig({ plugins: [react()], base: '/Connetction-Tree/', server: { port: 5173 } })
