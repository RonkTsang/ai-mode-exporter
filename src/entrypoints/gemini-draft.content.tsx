import { createRoot, type Root } from 'react-dom/client'
import { i18n } from '#i18n'
import { getAiModeTransferId } from '@/common/aiModeTransfer'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { Toaster, toaster } from '@/components/ui/toaster'
import { receiveAiModeTransfer } from './gemini-draft/receiveTransfer'

export default defineContentScript({
  include: ['chrome'],
  matches: ['https://gemini.google.com/app*'],
  runAt: 'document_idle',
  main(ctx) {
    const id = getAiModeTransferId(new URL(location.href))
    if (!id) return

    let host: HTMLDivElement | undefined
    let root: Root | undefined
    let receiving = false

    function clearStatus(): void {
      if (id) toaster.remove(id)
      root?.unmount()
      host?.remove()
      root = undefined
      host = undefined
    }

    async function receive(transferId: string): Promise<void> {
      if (receiving || ctx.isInvalid) return
      receiving = true
      clearStatus()
      const result = await receiveAiModeTransfer(transferId, ctx.signal)
      receiving = false
      if (ctx.isInvalid || result === 'attached' || result === 'cancelled') return

      host = document.createElement('div')
      host.dataset.aiModeEnchanceTransferStatus = ''
      document.body.append(host)
      root = createRoot(host)
      root.render(<Provider><Toaster /></Provider>)
      if (result === 'expired') {
        toaster.create({ id: transferId, type: 'error', title: i18n.t('aiModeContinue.transferExpired'), closable: true })
      } else {
        toaster.create({
          id: transferId,
          type: 'error',
          title: i18n.t('aiModeContinue.attachmentFailed'),
          closable: true,
          action: { label: i18n.t('aiModeContinue.retry'), onClick: () => void receive(transferId) },
        })
      }
    }

    ctx.onInvalidated(clearStatus)
    void receive(id)
  },
})
