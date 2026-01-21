import { defineConfig, loadEnv } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue2(),
      // 仅开发环境启用 SSL
      command === 'serve' ? basicSsl() : null
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    server: {
      host: '0.0.0.0',
      port: 8082,
      https: true,
      open: true
    },

    build: {
      // 输出目录根据环境区分
      outDir: isProduction ? 'dist/prod' : 'dist/dev',
      assetsDir: 'assets',
      // 生产环境压缩
      minify: isProduction ? 'terser' : false,
      // 生产环境移除 console 和 debugger
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : {},
      // 分包策略
      rollupOptions: {
        output: {
          // 入口文件命名
          entryFileNames: 'assets/js/[name]-[hash].js',
          // chunk 文件命名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          // 静态资源命名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
              return 'assets/images/[name]-[hash].[ext]'
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return 'assets/fonts/[name]-[hash].[ext]'
            }
            if (ext === 'css') {
              return 'assets/css/[name]-[hash].[ext]'
            }
            return 'assets/[name]-[hash].[ext]'
          },
          // 手动分包
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router'],
            'qrcode': ['html5-qrcode']
          }
        }
      },
      // 启用源码映射（开发环境包）
      sourcemap: !isProduction,
      // chunk 大小警告阈值
      chunkSizeWarningLimit: 1000
    },

    // 定义全局常量
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_PROD__: isProduction
    }
  }
})
