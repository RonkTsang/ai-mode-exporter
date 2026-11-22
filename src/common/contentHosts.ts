import type { ScriptPublicPath } from 'wxt/utils/inject-script'

export interface ContentHostConfig {
  readonly id: string
  readonly scriptFile: ScriptPublicPath
  readonly matches: readonly string[]
}

export const AI_MODE_HOST = {
  id: 'ai-mode',
  scriptFile: '/content-scripts/ai-mode.js',
  matches: ['https://www.google.com/search*'],
} as const satisfies ContentHostConfig

export const reinjectableContentHosts: readonly ContentHostConfig[] = [AI_MODE_HOST]
