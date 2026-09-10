import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test-setup.ts',
      coverage: {
        reporter: ['text', 'html'],
        exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx']
      }
    }
  })
)