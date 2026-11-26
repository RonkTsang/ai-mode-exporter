import { startAiModePrintBackground } from './background/aiModePrint'
import { startAiModeTransferBackground } from './background/aiModeTransfer'
import { startLifecycleBackground } from './background/lifecycle'
import { startContentReinjectBackground } from './background/reinject'

export default defineBackground(() => {
  startLifecycleBackground()
  if (import.meta.env.CHROME) {
    startAiModePrintBackground()
    startAiModeTransferBackground()
    startContentReinjectBackground()
  }
})
