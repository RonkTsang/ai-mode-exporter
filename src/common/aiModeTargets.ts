export const aiModeTargets = {
  gemini: {
    name: 'Gemini',
    newChatUrl: 'https://gemini.google.com/app',
    match: 'https://gemini.google.com/app*',
  },
  chatgpt: {
    name: 'ChatGPT',
    newChatUrl: 'https://chatgpt.com/',
    match: 'https://chatgpt.com/',
  },
} as const

export type AiModeTarget = keyof typeof aiModeTargets

export const aiModeTargetIds = Object.keys(aiModeTargets) as AiModeTarget[]

export function isAiModeTarget(value: unknown): value is AiModeTarget {
  return typeof value === 'string' && Object.hasOwn(aiModeTargets, value)
}
