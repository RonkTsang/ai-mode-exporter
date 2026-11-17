import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AI_MODE_TRANSFER_LIFETIME_MS,
  findStaleAiModeTransferKeys,
  getAiModeTransferId,
  getAiModeTransferKey,
  getAiModeTransferUrl,
  readActiveAiModeTransfer,
} from './aiModeTransfer'

describe('AI Mode transfer storage', () => {
  afterEach(() => vi.useRealTimers())

  it('expires after ten minutes and only identifies transfer keys for cleanup', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const transfer = { text: '# Conversation', title: 'Conversation', createdAt: Date.now() }
    const transferKey = getAiModeTransferKey('transfer')
    const stored = { [transferKey]: transfer, preferences: { theme: 'dark' } }

    vi.setSystemTime(AI_MODE_TRANSFER_LIFETIME_MS - 1)
    expect(readActiveAiModeTransfer(transfer)).toEqual(transfer)
    expect(findStaleAiModeTransferKeys(stored)).toEqual([])

    vi.setSystemTime(AI_MODE_TRANSFER_LIFETIME_MS)
    expect(readActiveAiModeTransfer(transfer)).toBeNull()
    expect(findStaleAiModeTransferKeys(stored)).toEqual([transferKey])
  })

  it('carries only the transfer ID and accepts it only on the new Gemini chat page', () => {
    const id = 'c3aa0996-0c57-4e27-b51f-6eb011f03deb'
    const url = new URL(getAiModeTransferUrl(id))
    expect(url.search).toBe('')
    expect(getAiModeTransferId(url)).toBe(id)
    expect(getAiModeTransferId(new URL(`https://gemini.google.com/app/existing-chat${url.hash}`))).toBeNull()
    expect(getAiModeTransferId(new URL(`https://www.google.com/app${url.hash}`))).toBeNull()
  })
})
