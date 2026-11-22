import { createRoot, type Root } from 'react-dom/client'
import { i18n } from '#i18n'
import { aiModeTargetIds, aiModeTargets, type AiModeTarget } from '@/common/aiModeTargets'
import { getAiModeTransferId } from '@/common/aiModeTransfer'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { Toaster, toaster } from '@/components/ui/toaster'
import { receiveAiModeTransfer, type DraftAdapter } from './agent-draft/receiveTransfer'
import { importChatGptDraft } from './chatgpt-draft/importDraft'
import { importGeminiDraft } from './gemini-draft/importDraft'

const draftAdapters: Record<AiModeTarget, DraftAdapter> = {
  gemini: importGeminiDraft,
  chatgpt: importChatGptDraft,
}

export default defineContentScript({
  include: ['chrome'],
  matches: aiModeTargetIds.map(target => aiModeTargets[target].match),
  runAt: 'document_idle',
  main(ctx) {
    const pageUrl = new URL(location.href)
    const target = aiModeTargetIds.find(candidate => getAiModeTransferId(candidate, pageUrl))
    if (!target) return
    const id = getAiModeTransferId(target, pageUrl)
    if (!id) return
    const importDraft = draftAdapters[target]

    let host: HTMLDivElement | undefined
    let root: Root | undefined
    let receiving = false

    const clearStatus = (): void => {
      toaster.remove(id)
      root?.unmount()
      host?.remove()
      root = undefined
      host = undefined
    }

    const receive = async (): Promise<void> => {
      if (receiving || ctx.isInvalid) return
      receiving = true
      clearStatus()
      const result = await receiveAiModeTransfer(target, id, importDraft, ctx.signal)
      receiving = false
      if (ctx.isInvalid || result === 'imported' || result === 'cancelled') return

      host = document.createElement('div')
      host.dataset.aiModeExporterTransferStatus = ''
      document.body.append(host)
      root = createRoot(host)
      root.render(<Provider><Toaster /></Provider>)
      if (result === 'expired') {
        toaster.create({ id, type: 'error', title: i18n.t('aiModeContinue.transferExpired'), closable: true })
      } else {
        toaster.create({
          id,
          type: 'error',
          title: i18n.t('aiModeContinue.attachmentFailed'),
          closable: true,
          action: { label: i18n.t('aiModeContinue.retry'), onClick: () => void receive() },
        })
      }
    }

    ctx.onInvalidated(clearStatus)
    void receive()
  },
})
