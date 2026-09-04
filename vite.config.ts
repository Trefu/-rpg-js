import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    cssMinify: 'esbuild',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('howler')) return 'vendor-howler'
            if (id.includes('pinia')) return 'vendor-pinia'
            if (id.includes('vue')) return 'vendor-vue'
            return 'vendor'
          }
          if (id.includes('/src/components/combat/CombatView')) return 'view-combat'
          if (id.includes('/src/components/expedition/ExpeditionMap')) return 'view-map'
          if (id.includes('/src/components/pregame/PreGameView')) return 'view-pregame'
        }
      }
    }
  }
})
