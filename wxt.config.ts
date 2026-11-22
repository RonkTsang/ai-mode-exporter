import { defineConfig } from 'wxt'
import type { WxtViteConfig } from 'wxt'
import svgr from 'vite-plugin-svgr'
import { reinjectableContentHosts } from './src/common/contentHosts'

type WxtVitePlugin = NonNullable<WxtViteConfig['plugins']>[number]

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  srcDir: 'src',
  manifest: (env) => ({
    name: env.mode === 'development' ? '🔴 AI Mode Power Kit' : 'AI Mode Power Kit',
    default_locale: 'en',
    ...(env.browser === 'chrome' ? {
      permissions: ['storage', 'scripting'],
      host_permissions: reinjectableContentHosts.flatMap(host => [...host.matches]),
    } : {}),
    ...(env.browser === 'firefox' ? {
      browser_specific_settings: {
        gecko: {
          id: 'ai-mode-power-kit@ronktsang.com',
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
