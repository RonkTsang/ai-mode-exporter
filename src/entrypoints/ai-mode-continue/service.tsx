import {
  AI_MODE_POPUP_OPEN_EVENT,
  AI_MODE_POPUP_OPEN_MESSAGE,
  AI_MODE_POPUP_STATUS_MESSAGE,
  isAiModeUrl,
} from '@/common/aiModeTransfer'
import type { ContentService, ServiceScope, ShadowUiHandle } from '@/content-runtime'
import { createLogger } from '@/utils/logger'
import type { AiModeSnapshot } from '../ai-mode/snapshot'
import { ContinueDialog } from './ContinueDialog'

const logger = createLogger('AI Mode Continue')

export function createContinueService(): ContentService<AiModeSnapshot> {
  let ui: ShadowUiHandle | undefined
  let mountedMain: HTMLElement | undefined
  let mountedPlate: HTMLElement | null | undefined
  let lastMountStatus: string | undefined

  function logStatus(snapshot: AiModeSnapshot): void {
    let status: string | undefined
    if (snapshot.isAiMode) {
      if (!snapshot.main) status = 'No unique main container with an AI Mode conversation or input plate'
      else if (!snapshot.plate) status = 'No unique input plate in the AI Mode main container; popup only'
      else status = 'Input plate found; showing the inline entry'
    }
    if (status && status !== lastMountStatus) logger.debug(status)
    lastMountStatus = status
  }

  function syncUi(scope: ServiceScope, snapshot: AiModeSnapshot): void {
    const { main, plate } = snapshot
    if (!main) return

    const hostIsInPlace = plate
      ? ui?.host.nextElementSibling === plate
      : ui?.host.parentElement === document.body
    if (mountedMain === main && mountedPlate === plate && hostIsInPlace) return

    ui?.unmount()
    mountedMain = main
    mountedPlate = plate
    ui = scope.mountShadowUi({
      id: 'continue',
      style: { backgroundColor: 'transparent' },
      attach(host) {
        if (plate) plate.before(host)
        else document.body.append(host)
      },
      render: () => <ContinueDialog main={main} showEntry={Boolean(plate)} />,
    })
  }

  return {
    id: 'ai-mode-continue',
    shouldMount(snapshot) {
      logStatus(snapshot)
      return snapshot.isAiMode && snapshot.main !== null
    },
    mount(scope, snapshot) {
      scope.onDispose(() => {
        ui = undefined
        mountedMain = undefined
        mountedPlate = undefined
      })

      scope.onMessage(AI_MODE_POPUP_STATUS_MESSAGE, () => (
        Boolean(ui) && isAiModeUrl(new URL(location.href))
      ))

      scope.onMessage(AI_MODE_POPUP_OPEN_MESSAGE, () => {
        if (!ui || !isAiModeUrl(new URL(location.href))) return false
        window.dispatchEvent(new Event(AI_MODE_POPUP_OPEN_EVENT))
        return true
      })

      syncUi(scope, snapshot)
    },
    update(snapshot, scope) {
      syncUi(scope, snapshot)
    },
  }
}
