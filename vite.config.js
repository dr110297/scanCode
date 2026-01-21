import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    vue2(),
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
