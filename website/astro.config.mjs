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
      title: 'AI Mode Exporter',
      customCss: ['./src/styles/custom.css'],
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'zh-cn': { label: '中文', lang: 'zh-CN' },
        'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
        de: { label: 'Deutsch', lang: 'de' },
        es: { label: 'Español', lang: 'es' },
        fr: { label: 'Français', lang: 'fr' },
        ja: { label: '日本語', lang: 'ja' },
        ko: { label: '한국어', lang: 'ko' },
        'pt-br': { label: 'Português (Brasil)', lang: 'pt-BR' },
      },
      sidebar: [
        {
          label: 'Guide',
          translations: { 'zh-CN': '指南', 'zh-TW': '指南', de: 'Anleitung', es: 'Guía', fr: 'Guide', ja: 'ガイド', ko: '가이드', 'pt-BR': 'Guia' },
          items: [
            { label: 'Quick Start', translations: { 'zh-CN': '快速开始', 'zh-TW': '快速開始', de: 'Schnellstart', es: 'Inicio rápido', fr: 'Démarrage rapide', ja: 'クイックスタート', ko: '빠른 시작', 'pt-BR': 'Início rápido' }, slug: 'guide/quick-start' },
          ],
        },
      ],
    }),
  ],
})
