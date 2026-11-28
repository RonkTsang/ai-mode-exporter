// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import starlight from '@astrojs/starlight'

const nanoidNonSecureCompat = fileURLToPath(new URL('./src/shims/nanoid-non-secure.ts', import.meta.url))

export default defineConfig({
  // Use the public origin for the target environment when building for deployment.
  site: process.env.SITE_URL || 'https://ai-mode-exporter.ronktsang.com',
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: { 'nanoid/non-secure': nanoidNonSecureCompat },
    },
  },
  integrations: [
    starlight({
      title: 'AI Mode Exporter',
      logo: { src: '../public/icon/128.png' },
      favicon: '/favicon.png',
      components: { Hero: './src/components/HomeHero.astro' },
      routeMiddleware: './src/seo.ts',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/RonkTsang/ai-mode-exporter' },
      ],
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
            {
              label: 'Installation and troubleshooting',
              translations: { 'zh-CN': '安装与故障排查', 'zh-TW': '安裝與疑難排解', de: 'Installation und Fehlerbehebung', es: 'Instalación y solución de problemas', fr: 'Installation et dépannage', ja: 'インストールとトラブルシューティング', ko: '설치 및 문제 해결', 'pt-BR': 'Instalação e solução de problemas' },
              slug: 'guide/install-and-troubleshoot',
            },
          ],
        },
        {
          label: 'Blog',
          translations: { 'zh-CN': '博客', 'zh-TW': '部落格', de: 'Blog', es: 'Blog', fr: 'Blog', ja: 'ブログ', ko: '블로그', 'pt-BR': 'Blog' },
          items: [
            {
              label: 'All tutorials',
              translations: { 'zh-CN': '全部教程', 'zh-TW': '所有教學', de: 'Alle Tutorials', es: 'Todos los tutoriales', fr: 'Tous les tutoriels', ja: 'すべてのチュートリアル', ko: '모든 튜토리얼', 'pt-BR': 'Todos os tutoriais' },
              slug: 'blog',
            },
            {
              label: 'Save a conversation',
              translations: { 'zh-CN': '保存对话', 'zh-TW': '儲存對話', de: 'Unterhaltung speichern', es: 'Guardar una conversación', fr: 'Enregistrer une conversation', ja: '会話を保存する', ko: '대화 저장', 'pt-BR': 'Salvar uma conversa' },
              slug: 'blog/save-google-ai-mode-conversation',
            },
            {
              label: 'Save as Markdown',
              translations: { 'zh-CN': '保存为 Markdown', 'zh-TW': '另存為 Markdown', de: 'Als Markdown speichern', es: 'Guardar como Markdown', fr: 'Enregistrer au format Markdown', ja: 'Markdown として保存', ko: 'Markdown으로 저장', 'pt-BR': 'Salvar como Markdown' },
              slug: 'blog/save-google-ai-mode-as-markdown',
            },
            {
              label: 'Save as PDF',
              translations: { 'zh-CN': '保存为 PDF', 'zh-TW': '另存為 PDF', de: 'Als PDF speichern', es: 'Guardar como PDF', fr: 'Enregistrer au format PDF', ja: 'PDF として保存', ko: 'PDF로 저장', 'pt-BR': 'Salvar como PDF' },
              slug: 'blog/save-google-ai-mode-as-pdf',
            },
            {
              label: 'Continue in Gemini',
              translations: { 'zh-CN': '在 Gemini 中继续', 'zh-TW': '在 Gemini 中繼續', de: 'In Gemini fortsetzen', es: 'Continuar en Gemini', fr: 'Continuer dans Gemini', ja: 'Gemini で続ける', ko: 'Gemini에서 이어가기', 'pt-BR': 'Continuar no Gemini' },
              slug: 'blog/continue-google-ai-mode-in-gemini',
            },
            {
              label: 'Continue in ChatGPT',
              translations: { 'zh-CN': '在 ChatGPT 中继续', 'zh-TW': '在 ChatGPT 中繼續', de: 'In ChatGPT fortsetzen', es: 'Continuar en ChatGPT', fr: 'Continuer dans ChatGPT', ja: 'ChatGPT で続ける', ko: 'ChatGPT에서 이어가기', 'pt-BR': 'Continuar no ChatGPT' },
              slug: 'blog/continue-google-ai-mode-in-chatgpt',
            },
            {
              label: 'Ask from the Chrome toolbar',
              translations: { 'zh-CN': '从 Chrome 工具栏提问', 'zh-TW': '從 Chrome 工具列提問', de: 'Über die Chrome-Symbolleiste fragen', es: 'Preguntar desde la barra de Chrome', fr: 'Poser une question depuis Chrome', ja: 'Chrome のツールバーから質問する', ko: 'Chrome 툴바에서 질문하기', 'pt-BR': 'Perguntar pela barra do Chrome' },
              slug: 'blog/open-google-ai-mode-from-chrome-toolbar',
            },
          ],
        },
        {
          label: 'Support',
          translations: { 'zh-CN': '支持', 'zh-TW': '支援', de: 'Support', es: 'Ayuda', fr: 'Assistance', ja: 'サポート', ko: '지원', 'pt-BR': 'Suporte' },
          slug: 'support',
        },
        {
          label: 'Privacy Policy',
          translations: { 'zh-CN': '隐私政策', 'zh-TW': '隱私權政策', de: 'Datenschutzerklärung', es: 'Política de privacidad', fr: 'Politique de confidentialité', ja: 'プライバシーポリシー', ko: '개인정보 처리방침', 'pt-BR': 'Política de privacidade' },
          slug: 'privacy',
        },
      ],
    }),
  ],
})
