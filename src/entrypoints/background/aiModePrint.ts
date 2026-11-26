import { browser } from 'wxt/browser'
import { AI_MODE_PRINT_JOB_PREFIX, AI_MODE_PRINT_MESSAGE, readAiModePrintJob, type AiModePrintJob } from '@/common/aiModePrint'
import { isAiModeUrl } from '@/common/aiModeTransfer'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AI Mode Print')

async function openPrintPage(job: AiModePrintJob): Promise<boolean> {
  const id = crypto.randomUUID()
  const key = `${AI_MODE_PRINT_JOB_PREFIX}${id}`
  try {
    const jobs = await browser.storage.session.get(null)
    const expiredKeys = Object.keys(jobs).filter(jobKey => (
      jobKey.startsWith(AI_MODE_PRINT_JOB_PREFIX) && !readAiModePrintJob(jobs[jobKey])
    ))
    if (expiredKeys.length) await browser.storage.session.remove(expiredKeys)
    await browser.storage.session.set({ [key]: job })
    const url = new URL(browser.runtime.getURL('/ai-mode-print.html'))
    url.hash = id
    await browser.tabs.create({ url: url.href })
    return true
  } catch (error) {
    logger.warn('Could not open PDF preview', error)
    await browser.storage.session.remove(key).catch(cleanupError => {
      logger.warn('Could not remove failed PDF export', cleanupError)
    })
    return false
  }
}

export function startAiModePrintBackground(): void {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== AI_MODE_PRINT_MESSAGE) return
    if (!sender.url || sender.frameId !== 0 || !isAiModeUrl(new URL(sender.url))) {
      sendResponse(false)
      return
    }
    const job = readAiModePrintJob({
      title: typeof message.title === 'string' ? message.title : '',
      text: message.text,
      imageSources: message.imageSources,
      createdAt: Date.now(),
    })
    if (!job) {
      sendResponse(false)
      return
    }
    void openPrintPage(job).then(sendResponse)
    return true
  })
}
