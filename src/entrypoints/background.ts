import { startAiModeTransferBackground } from './background/aiModeTransfer'

export default defineBackground(() => {
  if (import.meta.env.CHROME) startAiModeTransferBackground()
})
