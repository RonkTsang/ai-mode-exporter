export const AI_MODE_TRANSFER_MESSAGE = 'ai-mode:continue-in-gemini'
export const AI_MODE_TRANSFER_LIFETIME_MS = 10 * 60 * 1000
export const AI_MODE_ATTACHMENT_EXTENSION = '.md'

const GOOGLE_SEARCH_ORIGIN = 'https://www.google.com'
const GEMINI_ORIGIN = 'https://gemini.google.com'
const TRANSFER_FRAGMENT = 'ai-mode-enchance='
const TRANSFER_KEY_PREFIX = 'aiModeTransfer:'
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/

export interface AiModeTransfer {
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
    && url.pathname === '/search'
    && url.searchParams.get('udm') === '50'
}

export function getAiModeTransferUrl(id: string): string {
  return `${GEMINI_ORIGIN}/app#${TRANSFER_FRAGMENT}${id}`
}

export function getAiModeTransferId(url: URL): string | null {
  if (url.origin !== GEMINI_ORIGIN || url.pathname !== '/app') return null
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
  const { text, title, createdAt } = transfer
  if (
    typeof text !== 'string' || !text || typeof createdAt !== 'number'
    || !Number.isFinite(createdAt) || Date.now() - createdAt >= AI_MODE_TRANSFER_LIFETIME_MS
  ) return null
  return { text, title: typeof title === 'string' ? title : undefined, createdAt }
}

export function findStaleAiModeTransferKeys(values: Record<string, unknown>): string[] {
  return Object.keys(values).filter(
    key => key.startsWith(TRANSFER_KEY_PREFIX) && !readActiveAiModeTransfer(values[key]),
  )
}
