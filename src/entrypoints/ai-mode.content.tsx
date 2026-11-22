import { AI_MODE_HOST } from '@/common/contentHosts'
import { startContentHost } from '@/content-runtime'
import { readAiModeSnapshot } from './ai-mode/snapshot'
import { defaultAiModeDomProfile } from './ai-mode-continue/dom-config'
import { createContinueService } from './ai-mode-continue/service'

export default defineContentScript({
  include: ['chrome'],
  matches: [...AI_MODE_HOST.matches],
  runAt: 'document_idle',
  main(ctx) {
    startContentHost(ctx, {
      id: AI_MODE_HOST.id,
      readSnapshot: readAiModeSnapshot,
      observe: {
        mutationOptions: {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: defaultAiModeDomProfile.mountObservedAttributes,
        },
      },
      services: [createContinueService()],
    })
  },
})
