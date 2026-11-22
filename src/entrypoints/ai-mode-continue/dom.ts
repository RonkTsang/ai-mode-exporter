import { defaultAiModeDomProfile, type AiModeDomSelectors } from './dom-config'

const SKIP_NODES = '[hidden], [aria-hidden="true"], [role="region"], [role="dialog"], svg, script, style'

export interface AiModeTurn {
  number: number
  question: string
  answer: string
}

export interface AiModeConversation {
  title: string
  turns: AiModeTurn[]
  hasUnreadableTurns: boolean
}

function uniqueElement<T extends Element>(root: ParentNode, selector: string): T | null {
  const nodes = root.querySelectorAll<T>(selector)
  return nodes.length === 1 ? nodes.item(0) : null
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

function serializeTable(table: HTMLTableElement, selectors: AiModeDomSelectors): string {
  const rows = Array.from(table.rows, row => Array.from(row.cells, cell => (
    serializeChildren(cell, selectors).trim().replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|')
  )))
  const [header, ...body] = rows
  if (!header) return ''
  const columns = Math.max(...rows.map(row => row.length))
  if (columns === 0) return ''
  const line = (cells: string[]) => `| ${Array.from({ length: columns }, (_, i) => cells[i] ?? '').join(' | ')} |`
  return `\n\n${[line(header), line(Array<string>(columns).fill('---')), ...body.map(line)].join('\n')}\n\n`
}

function serializeChildren(element: Element, selectors: AiModeDomSelectors): string {
  return Array.from(element.childNodes, node => serializeNode(node, selectors)).join('')
}

function serializeNode(node: Node, selectors: AiModeDomSelectors): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').replace(/\s+/g, ' ')
  if (!(node instanceof Element) || node.matches(SKIP_NODES)) return ''
  // Google's response toolbar also contains the feedback form, even when it is closed.
  if (node.matches(selectors.answerUi)) return ''

  const role = node.getAttribute('role')
  if (node instanceof HTMLTableElement) return serializeTable(node, selectors)
  if (node instanceof HTMLImageElement) return node.alt.trim()
  if (node instanceof HTMLAnchorElement && /^https?:$/.test(node.protocol)) {
    const text = serializeChildren(node, selectors)
    const label = text.trim() || node.getAttribute('aria-label')
    const destination = node.href.replace(/[\\()]/g, '\\$&')
    return label ? `${text.trim() ? '' : ' '}[${label.replace(/[\[\]]/g, '\\$&')}](${destination})` : ''
  }

  // Inline entities, such as place names, appear as buttons embedded in the prose.
  if (node.matches(selectors.inlineTextButton)) return serializeChildren(node, selectors)
  if (node.matches('button, [role="button"]')) {
    const description = node.querySelector('img[alt]:not([alt=""])')?.getAttribute('alt')?.trim()
    return description ? `\n\n${description}\n\n` : ''
  }

  const content = serializeChildren(node, selectors)
  if (role === 'heading' || /^H[1-6]$/.test(node.tagName)) {
    const level = Number(node.getAttribute('aria-level') ?? node.tagName.slice(1))
    return `\n\n${'#'.repeat(Math.min(6, Math.max(3, level || 3)))} ${content.trim()}\n\n`
  }
  switch (node.tagName) {
    case 'BR': return '\n'
    case 'HR': return '\n\n---\n\n'
    case 'P':
    case 'DIV': return content.trim() ? `\n\n${content.trim()}\n\n` : ''
    case 'B':
    case 'STRONG': return content.trim() ? `**${content.trim()}**` : ''
    case 'LI': {
      const prefix = node.parentElement?.tagName === 'OL' ? '1.' : '-'
      return `\n${prefix} ${content.trim().replace(/\n{2,}/g, '\n').replace(/\n/g, '\n  ')}`
    }
    default: return content
  }
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
    if (!container) {
      if (index < questions.length - 1) conversation.hasUnreadableTurns = true
      continue
    }

    const [first, heading, body, extra] = markers.filter(marker => container.contains(marker))
    if (first !== block || !heading?.matches(selectors.answerHeading) || !body?.matches(selectors.answerBody) || extra) {
      if (index < questions.length - 1) conversation.hasUnreadableTurns = true
      continue
    }
    if (container.matches(selectors.turnScope) && body.closest(selectors.turnScope) !== container) continue

    unresolvedAnswers.delete(heading)
    unresolvedAnswers.delete(body)

    const answer = serializeChildren(body, selectors).replace(/\n{3,}/g, '\n\n').trim()
    if (answer) conversation.turns.push({ number: index + 1, question, answer })
    else if (index < questions.length - 1) conversation.hasUnreadableTurns = true
  }

  conversation.hasUnreadableTurns ||= unresolvedAnswers.size > 0
  return conversation
}

export function formatAiModeTranscript({ title, turns }: Pick<AiModeConversation, 'title' | 'turns'>): string {
  const transcript = turns.map(({ number, question, answer }) => (
    `## Turn ${number}\n\nQuestion: ${question}\n\nAnswer:\n\n${answer}`
  ))
  return [`# ${title || 'Google AI Mode conversation'}`, ...transcript].join('\n\n') + '\n'
}
