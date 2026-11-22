import { isAiModeUrl } from '@/common/aiModeTransfer'
import { findAiModeInputPlate, findAiModeMain } from '../ai-mode-continue/dom'

export interface AiModeSnapshot {
  url: URL
  isAiMode: boolean
  main: HTMLElement | null
  plate: HTMLElement | null
}

export function readAiModeSnapshot(): AiModeSnapshot {
  const url = new URL(location.href)
  const isAiMode = isAiModeUrl(url)
  const main = isAiMode ? findAiModeMain() : null
  const plate = main ? findAiModeInputPlate(main) : null
  return { url, isAiMode, main, plate }
}
