import { browser } from 'wxt/browser'
import { getQuickStartUrl } from '@/common/supportLinks'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Lifecycle')
const uninstallSurveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfHSqR7tXkXqR8HxTmunQnJBzat3FRhrPbhOf5WAgn_R3cmAw/viewform'

export function startLifecycleBackground(): void {
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install' && reason !== 'update') return

    try {
      await browser.runtime.setUninstallURL(uninstallSurveyUrl)
    } catch (error) {
      logger.error('Failed to set uninstall survey URL', error)
    }

    if (!import.meta.env.CHROME || reason !== 'install') return

    try {
      const url = getQuickStartUrl(browser.i18n.getUILanguage())
      await browser.tabs.create({ url })
    } catch (error) {
      logger.error('Failed to open Quick Start', error)
    }
  })
}
