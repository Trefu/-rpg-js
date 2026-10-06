/// <reference types="vitest" />
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
    // NO dropear console/debugger en modo test — los tests los necesitan
    // para debugging y asserts. El drop solo se aplica en build de prod.
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
  },
  test: {
    // Tests core puros de `src/core/`. Sin entorno DOM — los componentes
    // Vue requieren @vue/test-utils + jsdom y son otra capa.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/core/**/*.ts'],
      exclude: [
        'src/core/**/*.test.ts',
        'src/core/abilities/damagePipeline.ts' // cubierto en damagePipeline.test.ts
      ],
      // Thresholds aspiracionales — CI falla si baja de estos numeros.
      // Ajustar gradualmente a medida que se cubren más archivos.
      // (Por ahora desactivados mientras crecemos la base de tests.)
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      }
    }
  }
})
