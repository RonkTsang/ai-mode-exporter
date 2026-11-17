import { browser } from 'wxt/browser'
import {
  AI_MODE_TRANSFER_MESSAGE,
  findStaleAiModeTransferKeys,
  getAiModeTransferKey,
  getAiModeTransferUrl,
  isAiModeUrl,
  type AiModeTransfer,
} from '@/common/aiModeTransfer'

async function removeStaleTransfers(): Promise<void> {
  const values = await browser.storage.local.get(null)
  const keys = findStaleAiModeTransferKeys(values)
  if (keys.length > 0) await browser.storage.local.remove(keys)
}

async function openGeminiWithTransfer(text: string, title?: string): Promise<boolean> {
  const id = crypto.randomUUID()
  const key = getAiModeTransferKey(id)
  const transfer: AiModeTransfer = { text, title, createdAt: Date.now() }

  try {
    await removeStaleTransfers()
    await browser.storage.local.set({ [key]: transfer })
    await browser.tabs.create({ url: getAiModeTransferUrl(id) })
    return true
  } catch (error) {
    console.warn('[AI Mode] Could not open Gemini', error)
    await browser.storage.local.remove(key).catch(cleanupError => {
      console.warn('[AI Mode] Could not clear failed transfer', cleanupError)
    })
    return false
  }
}

export function startAiModeTransferBackground(): void {
  browser.runtime.onStartup.addListener(() => {
    void removeStaleTransfers().catch(error => console.warn('[AI Mode] Could not clear expired transfers', error))
  })
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== AI_MODE_TRANSFER_MESSAGE) return
    if (
      !sender.url || sender.frameId !== 0 || !isAiModeUrl(new URL(sender.url))
      || typeof message.text !== 'string' || !message.text.trim()
    ) {
      sendResponse(false)
      return
    }
    const title = typeof message.title === 'string' ? message.title : undefined
    void openGeminiWithTransfer(message.text, title).then(sendResponse)
    return true
  })
}
