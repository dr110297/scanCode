import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    vue(),
    basicSsl()
  ],
  server: {
    host: '0.0.0.0',
    port: 8082,
    https: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
