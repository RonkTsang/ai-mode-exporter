import { createRoot, type Root } from 'react-dom/client'
import { browser } from 'wxt/browser'
import { Provider } from '@/components/ui/provider-shadow-dom'
import {
  AI_MODE_POPUP_OPEN_EVENT,
  AI_MODE_POPUP_OPEN_MESSAGE,
  AI_MODE_POPUP_STATUS_MESSAGE,
  isAiModeUrl,
} from '@/common/aiModeTransfer'
import { ContinueDialog } from './ai-mode-continue/ContinueDialog'
import { findAiModeInputPlate, findAiModeMain } from './ai-mode-continue/dom'
import { defaultAiModeDomProfile } from './ai-mode-continue/dom-config'

export default defineContentScript({
  include: ['chrome'],
  matches: ['https://www.google.com/search*'],
  runAt: 'document_idle',
  main(ctx) {
    let mount: { main: HTMLElement; plate: HTMLElement | null; host: HTMLDivElement; root: Root } | undefined
    let frame: number | undefined
    let lastMountStatus: string | undefined

    function unmount(): void {
      if (!mount) return
      mount.root.unmount()
      mount.host.remove()
      mount = undefined
    }

    function reconcile(): void {
      frame = undefined
      const isAiMode = isAiModeUrl(new URL(location.href))
      const main = isAiMode ? findAiModeMain() : null
      const plate = main ? findAiModeInputPlate(main) : null
      if (import.meta.env.DEV) {
        let status: string | undefined
        if (isAiMode) {
          if (!main) status = 'No unique main container with an AI Mode conversation or input plate'
          else if (!plate) status = 'No unique input plate in the AI Mode main container; popup only'
          else status = 'Input plate found; showing the inline entry'
        }
        if (status && status !== lastMountStatus) console.debug(`[AI Mode Continue] ${status}`)
        lastMountStatus = status
      }
      if (!main) {
        unmount()
        return
      }
      const hostIsInPlace = plate
        ? mount?.host.nextElementSibling === plate
        : mount?.host.parentElement === document.body
      if (mount?.main === main && mount.plate === plate && hostIsInPlace) return
      unmount()

      const host = document.createElement('div')
      host.dataset.aiModeEnchanceContinue = ''
      if (plate) plate.before(host)
      else document.body.append(host)
      const root = createRoot(host)
      mount = { main, plate, host, root }
      root.render(
        <Provider style={{ backgroundColor: 'transparent' }}>
          <ContinueDialog main={main} showEntry={Boolean(plate)} />
        </Provider>,
      )
    }

    function scheduleReconcile(): void {
      frame ??= requestAnimationFrame(reconcile)
    }

    const observer = new MutationObserver(scheduleReconcile)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: defaultAiModeDomProfile.mountObservedAttributes,
    })
    ctx.addEventListener(window, 'wxt:locationchange', scheduleReconcile)
    const handlePopupMessage = (message: { type?: string }, _sender: unknown, sendResponse: (response: boolean) => void) => {
      if (message?.type === AI_MODE_POPUP_STATUS_MESSAGE) {
        sendResponse(Boolean(mount) && isAiModeUrl(new URL(location.href)))
        return
      }
      if (message?.type !== AI_MODE_POPUP_OPEN_MESSAGE) return
      if (!mount || !isAiModeUrl(new URL(location.href))) {
        sendResponse(false)
        return
      }
      window.dispatchEvent(new Event(AI_MODE_POPUP_OPEN_EVENT))
      sendResponse(true)
    }
    browser.runtime.onMessage.addListener(handlePopupMessage)
    reconcile()

    ctx.onInvalidated(() => {
      observer.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
      browser.runtime.onMessage.removeListener(handlePopupMessage)
      unmount()
    })
  },
})
