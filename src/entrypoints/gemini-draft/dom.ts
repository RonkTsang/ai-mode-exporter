import { AI_MODE_ATTACHMENT_EXTENSION } from '@/common/aiModeTransfer'

const TOOL_TRIGGER = 'input-area-v2 simplified-input-menu gem-icon-button > button[aria-haspopup="menu"]'
const FILE_INPUT = '[role="menu"] images-files-uploader:has(button[data-test-id="local-images-files-uploader-button"]) input[type="file"]'
const ATTACHMENT = 'input-area-v2 uploader-file-preview-container uploader-file-preview > .file-preview-container[aria-describedby]:has(> gem-attachment gem-icon-button.gem-attachment-close-button)'
const MARKDOWN_MIME_TYPE = 'text/markdown'

function findUnique<T extends HTMLElement>(selector: string): T | null {
  const matches = document.querySelectorAll<T>(selector)
  return matches.length === 1 ? matches.item(0) : null
}

export function findGeminiUploadTrigger(): HTMLButtonElement | null {
  const trigger = findUnique<HTMLButtonElement>(TOOL_TRIGGER)
  return trigger && !trigger.disabled && trigger.getAttribute('aria-disabled') !== 'true'
    && trigger.getClientRects().length > 0 ? trigger : null
}

export function findGeminiFileInput(): HTMLInputElement | null {
  const input = findUnique<HTMLInputElement>(FILE_INPUT)
  if (!input || input.disabled) return null
  const accepts = input.accept.toLowerCase().split(',').map(type => type.trim())
  return accepts.includes(AI_MODE_ATTACHMENT_EXTENSION) || accepts.includes(MARKDOWN_MIME_TYPE) ? input : null
}

export function addGeminiAttachment(input: HTMLInputElement, filename: string, text: string): void {
  const data = new DataTransfer()
  data.items.add(new File([text], filename, { type: MARKDOWN_MIME_TYPE }))
  input.files = data.files
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function findGeminiAttachment(filename: string): HTMLElement | null {
  const matches = Array.from(document.querySelectorAll<HTMLElement>(ATTACHMENT)).filter(card => {
    // The native tooltip keeps the full filename, including the extension.
    const descriptions = card.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []
    return descriptions.some(id => {
      const tooltip = document.getElementById(id)
      return tooltip?.getAttribute('role') === 'tooltip' && tooltip.textContent?.trim() === filename
    })
  })
  return matches.length === 1 ? matches[0]?.querySelector<HTMLElement>(':scope > gem-attachment') ?? null : null
}
