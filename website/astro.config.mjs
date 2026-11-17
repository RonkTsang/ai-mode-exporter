// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import starlight from '@astrojs/starlight'

const nanoidNonSecureCompat = fileURLToPath(new URL('./src/shims/nanoid-non-secure.ts', import.meta.url))

export default defineConfig({
  vite: {
    resolve: {
      alias: { 'nanoid/non-secure': nanoidNonSecureCompat },
    },
  },
  integrations: [
    starlight({
      title: 'AI Mode Enchance',
      customCss: ['./src/styles/custom.css'],
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'zh-cn': { label: '中文', lang: 'zh-CN' },
      },
      sidebar: [
        {
          label: 'Guide',
          translations: { 'zh-CN': '指南' },
          items: [
            { label: 'Quick Start', translations: { 'zh-CN': '快速开始' }, slug: 'guide/quick-start' },
          ],
        },
      ],
    }),
  ],
})
