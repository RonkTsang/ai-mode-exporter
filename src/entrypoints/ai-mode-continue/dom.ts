import { createLogger } from '@/utils/logger'
import { serializeAnswer } from './answer/serialize'
import { defaultAiModeDomProfile, type AiModeDomSelectors } from './dom-config'
import { uniqueElement } from './dom-utils'

const logger = createLogger('AI Mode Continue')

export interface AiModeTurn {
  number: number
  question: string
  answer: string
  previewImageSources?: ReadonlyMap<string, string>
}

export interface AiModeConversation {
  title: string
  turns: AiModeTurn[]
  hasUnreadableTurns: boolean
}

export function findAiModeInputPlate(
  root: ParentNode = document,
  selectors: AiModeDomSelectors = defaultAiModeDomProfile.selectors,
): HTMLElement | null {
  return uniqueElement(root, `:is(${selectors.main}) :is(${selectors.inputPlate})`)
}

export function findAiModeMain(
  root: ParentNode = document,
  selectors: AiModeDomSelectors = defaultAiModeDomProfile.selectors,
): HTMLElement | null {
  const evidenceSelector = `${selectors.inputPlate}, ${selectors.conversationRoot}`
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(selectors.main))
    .filter(main => main.querySelector(evidenceSelector))
  return candidates.length === 1 ? candidates[0]! : null
}

function readPageTitle(main: Element, selectors: AiModeDomSelectors): string | undefined {
  const heading = uniqueElement(main, selectors.pageHeading)?.textContent?.trim()
  const subject = heading?.match(/^[^:：]+[:：]\s*(.+)$/s)?.[1]?.trim()
  return subject && main.ownerDocument.title.startsWith(`${subject} - `) ? subject : undefined
}

function readQuestion(block: Element, selectors: AiModeDomSelectors): string {
  const liveHeading = uniqueElement(block, selectors.liveQuestion)
  if (liveHeading) return liveHeading.textContent?.trim() ?? ''

  // Restored turns include a localized heading that repeats the visible question.
  const heading = uniqueElement(block, selectors.restoredQuestionHeading)?.textContent?.replace(/\s+/g, ' ')
  if (!heading) return ''
  const candidates = Array.from(block.querySelectorAll(selectors.restoredQuestionText))
    .map(element => element.textContent?.trim() ?? '')
    .filter(text => text && heading.includes(text.replace(/\s+/g, ' ')))
  return candidates.length === 1 ? candidates[0] ?? '' : ''
}

function findTurnContainer(root: Element, question: Element, selectors: AiModeDomSelectors, answerMarkers: string): Element | null {
  const scope = question.closest(selectors.turnScope)
  if (scope && scope !== root && root.contains(scope)) return scope

  // Live questions sit outside the response's scope. Stop before the container
  // that groups multiple turns, even if some neighboring markers are missing.
  for (let parent = question.parentElement; parent && parent !== root; parent = parent.parentElement) {
    if (parent.matches(selectors.turnList)) break
    if (parent.querySelector(answerMarkers)) return parent
  }
  return null
}

function matchesSplitReply(
  block: Element,
  question: string,
  heading: Element,
  body: Element,
  selectors: AiModeDomSelectors,
): boolean {
  const list = block.closest(selectors.turnList)
  const replyScope = heading.closest(selectors.turnScope)
  if (!list || !replyScope || replyScope.closest(selectors.turnList) !== list) return false
  if (body.closest(selectors.turnScope) !== replyScope || body.closest(selectors.turnList) !== list) return false

  // Some responses render in a separate branch of the list. The heading
  // repeats the question and shares its data-rfsp reference.
  const reference = block.getAttribute('data-rfsp')
  return Boolean(reference && reference === heading.getAttribute('data-rfsp')
    && heading.textContent?.replace(/\s+/g, ' ').includes(question.replace(/\s+/g, ' ')))
}

export function readAiModeConversation(
  source: HTMLElement,
  selectors: AiModeDomSelectors = defaultAiModeDomProfile.selectors,
): AiModeConversation {
  const main = source.matches(selectors.main) ? source : source.closest<HTMLElement>(selectors.main)
  const conversation: AiModeConversation = { title: '', turns: [], hasUnreadableTurns: false }
  if (!main) return conversation

  const questionText = [selectors.liveQuestion, selectors.restoredQuestionHeading, selectors.restoredQuestionText].join(', ')
  const questionBlock = `:is(${selectors.questionBlock}):has(${questionText})`
  const answerMarkers = `${selectors.answerHeading}, ${selectors.answerBody}`
  const turnMarkers = `${questionBlock}, ${answerMarkers}`
  conversation.title = readPageTitle(main, selectors) ?? ''
  const root = uniqueElement(main, selectors.conversationRoot)
  if (!root) {
    conversation.hasUnreadableTurns = !!main.querySelector(turnMarkers)
    if (conversation.hasUnreadableTurns) {
      logger.warn('Could not find a unique conversation root', {
        conversationRootCount: main.querySelectorAll(selectors.conversationRoot).length,
      })
    }
    return conversation
  }

  const markers = Array.from(root.querySelectorAll(turnMarkers))
    .filter(marker => !marker.parentElement?.closest(selectors.answerBody))
  const unresolvedAnswers = new Set(markers.filter(marker => marker.matches(answerMarkers)))
  const questions = markers.filter(marker => marker.matches(questionBlock))
  for (const [index, block] of questions.entries()) {
    const question = readQuestion(block, selectors)
    conversation.title ||= question.replace(/\s+/g, ' ')
    if (!question) {
      conversation.hasUnreadableTurns = true
      continue
    }

    const container = findTurnContainer(root, block, selectors, answerMarkers)
    const nextQuestion = questions[index + 1]
    const [first, heading, body, extra] = container
      ? markers.filter(marker => container.contains(marker))
      : markers.slice(markers.indexOf(block), nextQuestion ? markers.indexOf(nextQuestion) : undefined)
    if (first !== block || !heading?.matches(selectors.answerHeading) || !body?.matches(selectors.answerBody) || extra) {
      if (nextQuestion) conversation.hasUnreadableTurns = true
      continue
    }
    if (container) {
      if (container.matches(selectors.turnScope) && body.closest(selectors.turnScope) !== container) continue
    } else if (!matchesSplitReply(block, question, heading, body, selectors)) continue

    unresolvedAnswers.delete(heading)
    unresolvedAnswers.delete(body)

    const { markdown: answer, previewImageSources } = serializeAnswer(body, selectors)
    if (answer) {
      const turn: AiModeTurn = { number: index + 1, question, answer }
      if (previewImageSources.size) turn.previewImageSources = previewImageSources
      conversation.turns.push(turn)
    } else if (index < questions.length - 1) {
      conversation.hasUnreadableTurns = true
    }
  }

  conversation.hasUnreadableTurns ||= unresolvedAnswers.size > 0
  if (conversation.hasUnreadableTurns) {
    logger.warn('Could not read all conversation turns', {
      questionCount: questions.length,
      exportedTurnCount: conversation.turns.length,
      unmatchedAnswerMarkerCount: unresolvedAnswers.size,
    })
  }
  return conversation
}

export function formatAiModeTranscript({ title, turns }: Pick<AiModeConversation, 'title' | 'turns'>): string {
  const transcript = turns.map(({ number, question, answer }) => (
    `## Turn ${number}\n\nQuestion: ${question}\n\nAnswer:\n\n${answer}`
  ))
  return [`# ${title || 'Google AI Mode conversation'}`, ...transcript].join('\n\n') + '\n'
}
