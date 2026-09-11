// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'
import { fileURLToPath, URL } from 'node:url'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      root: fileURLToPath(new URL('.', import.meta.url)),
      globals: true,
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          url: 'http://localhost'
        }
      },
      setupFiles: [fileURLToPath(new URL('./src/test-setup.ts', import.meta.url))],
      coverage: {
  reporter: ['text', 'html'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'src/**/*.stories.ts',
    'src/**/*.stories.tsx',
    'src/test-setup.ts',
    'src/index.ts',
    'src/**/index.ts',
    'src/**/types.ts',
    'src/vite-env.d.ts'
  ]
}
    }
  })
)