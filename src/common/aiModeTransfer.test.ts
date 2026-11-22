import { afterEach, describe, expect, it, vi } from 'vitest'
import { aiModeTargetIds, aiModeTargets, isAiModeTarget } from './aiModeTargets'
import {
  AI_MODE_TRANSFER_LIFETIME_MS,
  findStaleAiModeTransferKeys,
  getAiModeSearchUrl,
  getAiModeTransferId,
  getAiModeTransferKey,
  getAiModeTransferUrl,
  isAiModeUrl,
  readActiveAiModeTransfer,
} from './aiModeTransfer'

describe('AI Mode search URL', () => {
  it('preserves Unicode, newlines, and reserved characters using only the search parameters', () => {
    const query = 'Ko-fi 有 MCP 吗？\nCompare A+B & C #1'
    const url = new URL(getAiModeSearchUrl(query))

    expect(url.origin + url.pathname).toBe('https://www.google.com/search')
    expect(isAiModeUrl(url)).toBe(true)
    expect([...url.searchParams]).toEqual([['q', query], ['udm', '50']])
    expect(url.hash).toBe('')
  })
})

describe('AI Mode transfer storage', () => {
  afterEach(() => vi.useRealTimers())

  it('expires after ten minutes and only identifies transfer keys for cleanup', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const transfer = { target: 'chatgpt', text: '# Conversation', title: 'Conversation', createdAt: Date.now() }
    const transferKey = getAiModeTransferKey('transfer')
    const stored = { [transferKey]: transfer, preferences: { theme: 'dark' } }

    vi.setSystemTime(AI_MODE_TRANSFER_LIFETIME_MS - 1)
    expect(readActiveAiModeTransfer(transfer)).toEqual(transfer)
    expect(findStaleAiModeTransferKeys(stored)).toEqual([])

    vi.setSystemTime(AI_MODE_TRANSFER_LIFETIME_MS)
    expect(readActiveAiModeTransfer(transfer)).toBeNull()
    expect(findStaleAiModeTransferKeys(stored)).toEqual([transferKey])
  })

  it('keeps earlier transfers bound to Gemini and rejects unknown targets', () => {
    const legacy = { text: '# Conversation', createdAt: Date.now() }
    expect(readActiveAiModeTransfer(legacy)?.target).toBe('gemini')
    expect(readActiveAiModeTransfer({ ...legacy, target: 'unknown' })).toBeNull()
    expect(isAiModeTarget('toString')).toBe(false)
  })

  it.each(aiModeTargetIds)('carries only the transfer ID to the %s new chat page', target => {
    const id = 'c3aa0996-0c57-4e27-b51f-6eb011f03deb'
    const url = new URL(getAiModeTransferUrl(target, id))
    expect(url.href).toBe(`${aiModeTargets[target].newChatUrl}#ai-mode-enchance=${id}`)
    expect(url.search).toBe('')
    expect(getAiModeTransferId(target, url)).toBe(id)
    const other = target === 'gemini' ? 'chatgpt' : 'gemini'
    expect(getAiModeTransferId(other, url)).toBeNull()
    expect(getAiModeTransferId(target, new URL(`./existing-chat${url.hash}`, url))).toBeNull()
    expect(getAiModeTransferId(target, new URL('#ai-mode-enchance=invalid', url))).toBeNull()
  })
})
