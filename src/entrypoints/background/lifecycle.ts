import { browser } from 'wxt/browser'

const uninstallSurveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfHSqR7tXkXqR8HxTmunQnJBzat3FRhrPbhOf5WAgn_R3cmAw/viewform'

export function startLifecycleBackground(): void {
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install' && reason !== 'update') return

    try {
      await browser.runtime.setUninstallURL(uninstallSurveyUrl)
    } catch (error) {
      console.error('Failed to set uninstall survey URL', error)
    }
  })
}
