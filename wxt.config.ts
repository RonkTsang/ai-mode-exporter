import { defineConfig } from 'wxt'
import type { WxtViteConfig } from 'wxt'
import svgr from 'vite-plugin-svgr'

type WxtVitePlugin = NonNullable<WxtViteConfig['plugins']>[number]

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  srcDir: 'src',
  manifest: (env) => ({
    name: env.mode === 'development' ? '🔴 AI Mode Enchance' : 'AI Mode Enchance',
    default_locale: 'en',
    ...(env.browser === 'chrome' ? { permissions: ['storage'] } : {}),
    ...(env.browser === 'firefox' ? {
      browser_specific_settings: {
        gecko: {
          id: 'ai-mode-enchance@ronktsang.com',
          data_collection_permissions: { required: ['none'] },
        },
      },
    } : {}),
  }),
  hooks: {
    'entrypoints:found'(wxt, entrypoints) {
      if (wxt.config.command === 'serve') return
      const previewIndex = entrypoints.findIndex(({ name }) => name === 'shadow-preview')
      if (previewIndex !== -1) entrypoints.splice(previewIndex, 1)
    },
  },
  vite: () => ({
    plugins: [svgr() as unknown as WxtVitePlugin],
    build: { rolldownOptions: { output: { charset: 'ascii' } } },
  }),
})
