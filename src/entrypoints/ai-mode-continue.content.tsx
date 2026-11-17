import { createRoot, type Root } from 'react-dom/client'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { isAiModeUrl } from '@/common/aiModeTransfer'
import { ContinueDialog } from './ai-mode-continue/ContinueDialog'
import { findAiModeInputPlate } from './ai-mode-continue/dom'

export default defineContentScript({
  include: ['chrome'],
  matches: ['https://www.google.com/search*'],
  runAt: 'document_idle',
  main(ctx) {
    let mount: { plate: HTMLElement; host: HTMLDivElement; root: Root } | undefined
    let frame: number | undefined

    function unmount(): void {
      if (!mount) return
      mount.root.unmount()
      mount.host.remove()
      mount = undefined
    }

    function reconcile(): void {
      frame = undefined
      const plate = isAiModeUrl(new URL(location.href)) ? findAiModeInputPlate() : null
      if (mount?.plate === plate && mount.host.nextElementSibling === plate) return
      unmount()
      if (!plate) return

      const host = document.createElement('div')
      host.dataset.aiModeEnchanceContinue = ''
      plate.before(host)
      const root = createRoot(host)
      mount = { plate, host, root }
      root.render(
        <Provider style={{ backgroundColor: 'transparent' }}>
          <ContinueDialog plate={plate} />
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
      attributeFilter: ['role', 'data-xid'],
    })
    ctx.addEventListener(window, 'wxt:locationchange', scheduleReconcile)
    reconcile()

    ctx.onInvalidated(() => {
      observer.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
      unmount()
    })
  },
})
