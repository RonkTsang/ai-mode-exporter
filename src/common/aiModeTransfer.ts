import { aiModeTargets, isAiModeTarget, type AiModeTarget } from './aiModeTargets'

export const AI_MODE_TRANSFER_MESSAGE = 'ai-mode:continue'
export const AI_MODE_POPUP_STATUS_MESSAGE = 'ai-mode:popup-status'
export const AI_MODE_POPUP_OPEN_MESSAGE = 'ai-mode:popup-open'
export const AI_MODE_POPUP_OPEN_EVENT = 'ai-mode:open-continue'
export const AI_MODE_TRANSFER_LIFETIME_MS = 10 * 60 * 1000
export const AI_MODE_ATTACHMENT_EXTENSION = '.md'

const GOOGLE_SEARCH_ORIGIN = 'https://www.google.com'
const GOOGLE_SEARCH_PATH = '/search'
const AI_MODE_SEARCH_MODE = '50'
const TRANSFER_FRAGMENT = 'ai-mode-power-kit='
const TRANSFER_KEY_PREFIX = 'aiModeTransfer:'
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/

export interface AiModeTransfer {
  target: AiModeTarget
  text: string
  title?: string
  createdAt: number
}

export function getAiModeAttachmentFilename(title: string | undefined, id: string): string {
  const safeTitle = title?.replace(/[<>:"/\\|?*\p{Cc}]/gu, ' ').replace(/\s+/g, ' ').trim() ?? ''
  const basename = Array.from(safeTitle).slice(0, 80).join('').replace(/^[. ]+|[. ]+$/g, '')
  return `${basename || `AI-${id.slice(0, 8)}`}${AI_MODE_ATTACHMENT_EXTENSION}`
}

export function isAiModeUrl(url: URL): boolean {
  return url.origin === GOOGLE_SEARCH_ORIGIN
    && url.pathname === GOOGLE_SEARCH_PATH
    && url.searchParams.get('udm') === AI_MODE_SEARCH_MODE
}

export function getAiModeSearchUrl(query: string): string {
  const url = new URL(GOOGLE_SEARCH_PATH, GOOGLE_SEARCH_ORIGIN)
  url.searchParams.set('q', query)
  url.searchParams.set('udm', AI_MODE_SEARCH_MODE)
  return url.href
}

export function getAiModeTransferUrl(target: AiModeTarget, id: string): string {
  return `${aiModeTargets[target].newChatUrl}#${TRANSFER_FRAGMENT}${id}`
}

export function getAiModeTransferId(target: AiModeTarget, url: URL): string | null {
  const newChat = new URL(aiModeTargets[target].newChatUrl)
  if (url.origin !== newChat.origin || url.pathname !== newChat.pathname) return null
  const prefix = `#${TRANSFER_FRAGMENT}`
  if (!url.hash.startsWith(prefix)) return null
  const id = url.hash.slice(prefix.length)
  return UUID_PATTERN.test(id) ? id : null
}

export function getAiModeTransferKey(id: string): string {
  return `${TRANSFER_KEY_PREFIX}${id}`
}

export function readActiveAiModeTransfer(value: unknown): AiModeTransfer | null {
  if (!value || typeof value !== 'object') return null
  const transfer = value as Partial<AiModeTransfer>
  // Transfers from before destination selection always belonged to Gemini.
  const { target = 'gemini', text, title, createdAt } = transfer
  if (
    !isAiModeTarget(target) || typeof text !== 'string' || !text || typeof createdAt !== 'number'
    || !Number.isFinite(createdAt) || Date.now() - createdAt >= AI_MODE_TRANSFER_LIFETIME_MS
  ) return null
  return { target, text, title: typeof title === 'string' ? title : undefined, createdAt }
}

export function findStaleAiModeTransferKeys(values: Record<string, unknown>): string[] {
  return Object.keys(values).filter(
    key => key.startsWith(TRANSFER_KEY_PREFIX) && !readActiveAiModeTransfer(values[key]),
  )
}
