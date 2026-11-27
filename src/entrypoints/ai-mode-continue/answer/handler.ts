import type { AiModeDomSelectors } from '../dom-config'

export interface AnswerSerializationContext {
  selectors: AiModeDomSelectors
  previewImageSources: Map<string, string>
}

interface AnswerComponentContext extends AnswerSerializationContext {
  serializeChildren(element: Element): string
}

export interface AnswerComponentHandler {
  matches(element: Element, selectors: AiModeDomSelectors): boolean
  // A match owns its subtree. Return an empty string to omit it entirely.
  serialize(element: Element, context: AnswerComponentContext): string
}
