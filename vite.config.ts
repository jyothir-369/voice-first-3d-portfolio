import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@content': resolve(import.meta.dirname, './content')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: (id) => id.includes('/node_modules/three/') ? 'three' : undefined
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
        '@content': resolve(import.meta.dirname, './content')
      }
    }
  }
})
