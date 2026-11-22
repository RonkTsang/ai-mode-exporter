import { waitForDraft, type DraftAdapter } from '../agent-draft/receiveTransfer'

const HOME_EDITOR = 'main form[data-chatgpt-composer][data-composer-placement="home"] [data-composer-markdown][role="textbox"][contenteditable="true"]'
const VISIBLE_ATTACHMENTS = '[data-composer-attachments][data-visible-attachments]'
const READY_TO_SEND = 'button[type="submit"]:not([disabled]):not([aria-disabled="true"])'
const LONG_PASTE_THRESHOLD = 10_000

function findHomeEditor(): HTMLElement | null {
  const editors = Array.from(document.querySelectorAll<HTMLElement>(HOME_EDITOR))
    .filter(editor => editor.getClientRects().length > 0 && !editor.closest('[inert]'))
  return editors.length === 1 ? editors[0]! : null
}

export const importChatGptDraft: DraftAdapter = async (transfer, _id, canImport) => {
  // The editor can accept text before ChatGPT initializes its long-paste handler.
  const pasteAfter = Date.now() + (transfer.text.length > LONG_PASTE_THRESHOLD ? 3_000 : 0)
  const editor = await waitForDraft(
    () => Date.now() >= pasteAfter ? findHomeEditor() : null,
    12_000,
    canImport,
  )
  const form = editor?.closest('form')
  if (!editor || !form || !canImport()) return false

  editor.focus()
  if (!canImport() || !editor.isConnected || editor.textContent?.trim() || form.querySelector(VISIBLE_ATTACHMENTS)) return false

  // Let ChatGPT handle plain-text paste, including its own long-text attachment flow.
  const clipboardData = new DataTransfer()
  clipboardData.setData('text/plain', transfer.text)
  editor.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData,
    bubbles: true,
    cancelable: true,
    composed: true,
  }))

  return Boolean(await waitForDraft(() => {
    if (!form.isConnected) return null
    if (form.querySelector(VISIBLE_ATTACHMENTS)) return form.querySelector(READY_TO_SEND)
    return editor.textContent?.trim() || null
  }, 30_000, canImport))
}
