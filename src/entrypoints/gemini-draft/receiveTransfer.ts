import { browser } from 'wxt/browser'
import {
  AI_MODE_TRANSFER_LIFETIME_MS,
  getAiModeAttachmentFilename,
  getAiModeTransferId,
  getAiModeTransferKey,
  readActiveAiModeTransfer,
} from '@/common/aiModeTransfer'
import { addGeminiAttachment, findGeminiAttachment, findGeminiFileInput, findGeminiUploadTrigger } from './dom'

type TransferResult = 'attached' | 'expired' | 'failed' | 'cancelled'

async function waitFor<T>(find: () => T | null, timeoutMs: number, isCurrent: () => boolean): Promise<T | null> {
  const deadline = Date.now() + timeoutMs
  while (isCurrent()) {
    const element = find()
    if (element) return element
    if (Date.now() >= deadline) break
    await new Promise(resolve => window.setTimeout(resolve, 100))
  }
  return null
}

export async function receiveAiModeTransfer(id: string, signal: AbortSignal): Promise<TransferResult> {
  const key = getAiModeTransferKey(id)
  const isCurrent = () => !signal.aborted && getAiModeTransferId(new URL(location.href)) === id

  async function finish(result: 'attached' | 'expired'): Promise<TransferResult> {
    await browser.storage.local.remove(key)
    if (!isCurrent()) return 'cancelled'
    history.replaceState(history.state, '', location.pathname + location.search)
    return result
  }

  try {
    const stored = await browser.storage.local.get(key)
    if (!isCurrent()) return 'cancelled'
    const transfer = readActiveAiModeTransfer(stored[key])
    if (!transfer) return await finish('expired')

    const filename = getAiModeAttachmentFilename(transfer.title, id)
    if (!findGeminiAttachment(filename)) {
      const isFresh = () => Date.now() - transfer.createdAt < AI_MODE_TRANSFER_LIFETIME_MS
      const canAttach = () => isCurrent() && isFresh()
      const trigger = await waitFor(findGeminiUploadTrigger, 12_000, canAttach)
      if (!isCurrent()) return 'cancelled'
      if (!isFresh()) return await finish('expired')
      if (!trigger) return 'failed'
      if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click()

      const input = await waitFor(findGeminiFileInput, 5_000, canAttach)
      if (!isCurrent()) return 'cancelled'
      if (!isFresh()) return await finish('expired')
      if (!input) return 'failed'
      addGeminiAttachment(input, filename, transfer.text)
    }

    const attached = await waitFor(() => findGeminiAttachment(filename), 30_000, isCurrent)
    if (!isCurrent()) return 'cancelled'
    return attached ? await finish('attached') : 'failed'
  } catch {
    return isCurrent() ? 'failed' : 'cancelled'
  }
}
