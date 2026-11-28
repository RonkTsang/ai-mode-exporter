import { afterEach, expect, it, vi } from 'vitest'
import { startLifecycleBackground } from './lifecycle'

const { addInstalledListener, createTab, setUninstallUrl } = vi.hoisted(() => ({
  addInstalledListener: vi.fn<(listener: (details: { reason: string }) => Promise<void>) => void>(),
  createTab: vi.fn(),
  setUninstallUrl: vi.fn(),
}))

vi.mock('wxt/browser', () => ({
  browser: {
    i18n: { getUILanguage: () => 'zh-TW' },
    runtime: {
      onInstalled: { addListener: addInstalledListener },
      setUninstallURL: setUninstallUrl,
    },
    tabs: { create: createTab },
  },
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

it.each([
  { chrome: true, reason: 'install', opensGuide: true, registersSurvey: true },
  { chrome: true, reason: 'update', opensGuide: false, registersSurvey: true },
  { chrome: true, reason: 'chrome_update', opensGuide: false, registersSurvey: false },
  { chrome: false, reason: 'install', opensGuide: false, registersSurvey: true },
])('handles $reason with Chrome set to $chrome', async ({ chrome, reason, opensGuide, registersSurvey }) => {
  vi.stubEnv('CHROME', chrome ? 'true' : undefined)
  startLifecycleBackground()
  await addInstalledListener.mock.calls[0]![0]({ reason })

  expect(setUninstallUrl).toHaveBeenCalledTimes(registersSurvey ? 1 : 0)
  expect(createTab).toHaveBeenCalledTimes(opensGuide ? 1 : 0)
  if (opensGuide) {
    expect(createTab).toHaveBeenCalledWith({
      url: 'https://ai-mode-exporter.ronktsang.com/zh-tw/guide/quick-start/',
    })
  }
})
