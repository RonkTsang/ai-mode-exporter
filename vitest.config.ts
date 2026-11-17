import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.wxt/',
        'dist/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '~': path.resolve(import.meta.dirname, './src'),
      '#imports': path.resolve(import.meta.dirname, './src/test/mocks/wxt-imports.ts'),
      '#i18n': path.resolve(import.meta.dirname, './src/test/mocks/wxt-i18n.ts'),
    },
  },
});
