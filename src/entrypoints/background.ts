import { startAiModeTransferBackground } from './background/aiModeTransfer'
import { startLifecycleBackground } from './background/lifecycle'

export default defineBackground(() => {
  startLifecycleBackground()
  if (import.meta.env.CHROME) startAiModeTransferBackground()
})
