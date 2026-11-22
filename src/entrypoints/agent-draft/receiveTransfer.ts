import { browser } from 'wxt/browser'
import type { AiModeTarget } from '@/common/aiModeTargets'
import {
  AI_MODE_TRANSFER_LIFETIME_MS,
  getAiModeTransferId,
  getAiModeTransferKey,
  readActiveAiModeTransfer,
  type AiModeTransfer,
} from '@/common/aiModeTransfer'

type TransferResult = 'imported' | 'expired' | 'failed' | 'cancelled'

export type DraftAdapter = (
  transfer: AiModeTransfer,
  id: string,
  canImport: () => boolean,
) => Promise<boolean>

export async function waitForDraft<T>(
  find: () => T | null,
  timeoutMs: number,
  canImport: () => boolean,
): Promise<T | null> {
  const deadline = Date.now() + timeoutMs
  while (canImport()) {
    const result = find()
    if (result) return result
    if (Date.now() >= deadline) break
    await new Promise(resolve => window.setTimeout(resolve, 100))
  }
  return null
}

export async function receiveAiModeTransfer(
  target: AiModeTarget,
  id: string,
  importDraft: DraftAdapter,
  signal: AbortSignal,
): Promise<TransferResult> {
  const key = getAiModeTransferKey(id)
  const isCurrent = () => !signal.aborted && getAiModeTransferId(target, new URL(location.href)) === id

  async function finish(result: 'imported' | 'expired', removeRecord = true): Promise<TransferResult> {
    if (!isCurrent()) return 'cancelled'
    history.replaceState(history.state, '', location.pathname + location.search)
    // A storage cleanup failure must not prompt a second import into the same draft.
    if (removeRecord) await browser.storage.local.remove(key).catch(() => {})
    return result
  }

  try {
    const stored = await browser.storage.local.get(key)
    if (!isCurrent()) return 'cancelled'
    const transfer = readActiveAiModeTransfer(stored[key])
    if (!transfer) return await finish('expired')
    if (transfer.target !== target) return await finish('expired', false)

    const isFresh = () => Date.now() - transfer.createdAt < AI_MODE_TRANSFER_LIFETIME_MS
    const imported = await importDraft(transfer, id, () => isCurrent() && isFresh())
    if (imported) return await finish('imported')
    if (!isCurrent()) return 'cancelled'
    return isFresh() ? 'failed' : await finish('expired')
  } catch {
    return isCurrent() ? 'failed' : 'cancelled'
  }
}
