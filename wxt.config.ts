import { readFileSync } from 'node:fs'
import { defineConfig } from 'wxt'
import type { WxtViteConfig } from 'wxt'
import svgr from 'vite-plugin-svgr'
import { reinjectableContentHosts } from './src/common/contentHosts'

type WxtVitePlugin = NonNullable<WxtViteConfig['plugins']>[number]
const packageVersion = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
).version

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  srcDir: 'src',
  zip: {
    artifactTemplate: '{{name}}-{{version}}-{{browser}}{{modeSuffix}}.zip',
    sourcesTemplate: '{{name}}-{{version}}-sources{{modeSuffix}}.zip',
  },
  manifest: (env) => ({
    name: env.mode === 'development'
      ? '🔴 AI Mode Exporter'
      : 'AI Mode Exporter — Continue in Gemini & ChatGPT',
    short_name: 'AI Mode Exporter',
    // Support dynamic version from CI/CD pipeline (dry-run before semantic-release bumps package.json)
    version: process.env.RELEASE_VERSION || packageVersion,
    default_locale: 'en',
    ...(env.browser === 'chrome' ? {
      permissions: ['storage', 'scripting'],
      host_permissions: reinjectableContentHosts.flatMap(host => [...host.matches]),
    } : {}),
    ...(env.browser === 'firefox' ? {
      browser_specific_settings: {
        gecko: {
          id: 'ai-mode-exporter@ronktsang.com',
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
