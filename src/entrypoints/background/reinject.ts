import { browser } from 'wxt/browser'
import { reinjectableContentHosts, type ContentHostConfig } from '@/common/contentHosts'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ContentHost')

async function reinjectHost(host: ContentHostConfig): Promise<void> {
  const tabs = await browser.tabs.query({ url: [...host.matches] })
  const eligibleTabs = tabs.filter(
    (tab): tab is typeof tab & { id: number } => tab.id !== undefined && !tab.discarded,
  )
  logger.debug(`reinjecting "${host.id}"`, {
    tabIds: eligibleTabs.map(tab => tab.id),
    skipped: tabs.length - eligibleTabs.length,
  })
  const results = await Promise.allSettled(
    eligibleTabs.map(tab => browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: [host.scriptFile],
    })),
  )
  const failed = results.filter(result => result.status === 'rejected').length
  logger.debug(`reinjected "${host.id}"`, {
    succeeded: results.length - failed,
    failed,
  })
}

export async function reinjectContentHosts(
  hosts: readonly ContentHostConfig[] = reinjectableContentHosts,
): Promise<void> {
  await Promise.allSettled(hosts.map(reinjectHost))
}

export function startContentReinjectBackground(): void {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason !== 'install' && reason !== 'update') return
    logger.debug('onInstalled triggered reinjection', { reason })
    void reinjectContentHosts().catch(error => {
      logger.warn('Failed to reinject content hosts', error)
    })
  })
}
