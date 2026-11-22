import bundledConfig from './dom-config.json'

export interface AiModeDomSelectors {
  main: string
  inputPlate: string
  conversationRoot: string
  pageHeading: string
  turnScope: string
  turnList: string
  questionBlock: string
  liveQuestion: string
  restoredQuestionHeading: string
  restoredQuestionText: string
  answerHeading: string
  answerBody: string
  inlineTextButton: string
  answerUi: string
}

export interface AiModeDomProfile {
  mountObservedAttributes: string[]
  selectors: AiModeDomSelectors
}

export const defaultAiModeDomProfile: AiModeDomProfile = bundledConfig.profiles['google-ai-mode']
