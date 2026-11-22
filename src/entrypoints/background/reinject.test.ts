import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentHostConfig } from '@/common/contentHosts'

const { queryTabs, executeScript, addInstalledListener } = vi.hoisted(() => ({
  queryTabs: vi.fn(),
  executeScript: vi.fn(),
  addInstalledListener: vi.fn(),
}))

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: { query: queryTabs },
    scripting: { executeScript },
    runtime: {
      onInstalled: { addListener: addInstalledListener },
    },
  },
}))

import { reinjectContentHosts, startContentReinjectBackground } from './reinject'

const testHost: ContentHostConfig = {
  id: 'ai-mode',
  scriptFile: '/content-scripts/ai-mode.js' as ContentHostConfig['scriptFile'],
  matches: ['https://www.google.com/search*'],
}

describe('reinjectContentHosts', () => {
  beforeEach(() => {
    queryTabs.mockReset()
    executeScript.mockReset()
    addInstalledListener.mockReset()
  })

  it('reinjects eligible tabs and skips discarded or id-less tabs', async () => {
    queryTabs.mockResolvedValue([
      { id: 1, discarded: false },
      { id: 2, discarded: true },
      { discarded: false },
      { id: 3, discarded: false },
    ])
    executeScript.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Tab closed'))

    await reinjectContentHosts([testHost])

    expect(queryTabs).toHaveBeenCalledWith({ url: ['https://www.google.com/search*'] })
    expect(executeScript).toHaveBeenCalledTimes(2)
    expect(executeScript).toHaveBeenNthCalledWith(1, {
      target: { tabId: 1 },
      files: ['/content-scripts/ai-mode.js'],
    })
    expect(executeScript).toHaveBeenNthCalledWith(2, {
      target: { tabId: 3 },
      files: ['/content-scripts/ai-mode.js'],
    })
  })

  it('triggers reinjection on install and update only', async () => {
    queryTabs.mockResolvedValue([])
    startContentReinjectBackground()

    expect(addInstalledListener).toHaveBeenCalledTimes(1)
    const listener = addInstalledListener.mock.calls[0]![0] as (details: { reason: string }) => void

    listener({ reason: 'chrome_update' })
    expect(queryTabs).not.toHaveBeenCalled()

    listener({ reason: 'install' })
    listener({ reason: 'update' })
    await vi.waitFor(() => expect(queryTabs).toHaveBeenCalledTimes(2))
  })
})
