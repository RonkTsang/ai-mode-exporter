export const AI_MODE_PRINT_MESSAGE = 'ai-mode:print'
export const AI_MODE_PRINT_JOB_PREFIX = 'aiModePrint:'

const printJobLifetimeMs = 5 * 60 * 1000
// Keep temporary image data well below Chrome's shared session storage quota.
const maxPrintImageChars = 2_000_000

export function readAiModePrintImageSources(value: unknown): [string, string][] {
  if (!Array.isArray(value)) return []
  const images = new Map<string, string>()
  let totalChars = 0
  for (const entry of value) {
    if (!Array.isArray(entry)) continue
    const [url, dataUrl] = entry
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || images.has(url)
      || typeof dataUrl !== 'string' || !/^data:image\/(?:jpeg|png|gif|webp|avif);base64,/i.test(dataUrl)) continue
    const imageChars = url.length + dataUrl.length
    if (totalChars + imageChars > maxPrintImageChars) continue
    images.set(url, dataUrl)
    totalChars += imageChars
  }
  return [...images]
}

export interface AiModePrintJob {
  title: string
  text: string
  createdAt: number
  imageSources: [string, string][]
}

export function readAiModePrintJob(value: unknown): AiModePrintJob | null {
  if (!value || typeof value !== 'object') return null
  const { title, text, createdAt, imageSources } = value as Partial<AiModePrintJob>
  if (typeof title !== 'string' || typeof text !== 'string' || !text.trim()
    || typeof createdAt !== 'number' || !Number.isFinite(createdAt)
    || Date.now() - createdAt >= printJobLifetimeMs) return null
  return { title, text, createdAt, imageSources: readAiModePrintImageSources(imageSources) }
}
