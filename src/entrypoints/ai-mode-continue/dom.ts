import { defaultAiModeDomProfile, type AiModeDomSelectors } from './dom-config'

const SKIP_NODES = '[hidden], [aria-hidden="true"], [role="dialog"], svg, script, style'

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

interface AnswerSerialization {
  selectors: AiModeDomSelectors
  previewImageSources: Map<string, string>
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

function serializeTable(table: HTMLTableElement, context: AnswerSerialization, insideLink: boolean): string {
  const rows = Array.from(table.rows, row => Array.from(row.cells, cell => (
    serializeChildren(cell, context, insideLink).trim().replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|')
  )))
  const [header, ...body] = rows
  if (!header) return ''
  const columns = Math.max(...rows.map(row => row.length))
  if (columns === 0) return ''
  const line = (cells: string[]) => `| ${Array.from({ length: columns }, (_, i) => cells[i] ?? '').join(' | ')} |`
  return `\n\n${[line(header), line(Array<string>(columns).fill('---')), ...body.map(line)].join('\n')}\n\n`
}

type MarkdownPart = string | { strong: string }

function escapeLinkLabel(text: string): string {
  return text.replace(/[\\[\]]/g, '\\$&')
}

function escapeDestination(url: string): string {
  return url.replace(/[\\()]/g, '\\$&')
}

function webUrl(value: unknown, base?: string): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value, base)
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}

function serializeImage(image: HTMLImageElement, source = ''): string {
  const alt = image.alt.replace(/\s+/g, ' ').trim().replace(/[\\[\]*_`~<&]/g, '\\$&')
  if (image.hasAttribute('alt') && !alt) return ''
  const url = source || webUrl(image.currentSrc, image.baseURI) || webUrl(image.getAttribute('src'), image.baseURI)
  return url ? `![${alt}](${escapeDestination(url)})` : alt
}

function readImageCard(card: Element): { imageUrl: string; sourceUrl: string } {
  let metadata: unknown
  try {
    metadata = JSON.parse(card.getAttribute('data-im') ?? '')
  } catch {
    return { imageUrl: '', sourceUrl: '' }
  }
  if (!Array.isArray(metadata)) return { imageUrl: '', sourceUrl: '' }

  // Google's image viewer stores [URL, height, width] for the thumbnail and original.
  const [, , thumbnail, original, details] = metadata
  const source = details?.['2003']
  return {
    imageUrl: webUrl(Array.isArray(original) ? original[0] : null)
      || webUrl(Array.isArray(thumbnail) ? thumbnail[0] : null),
    sourceUrl: webUrl(Array.isArray(source) ? source[2] : null),
  }
}

function serializeGallery(gallery: Element, context: AnswerSerialization): string {
  const cards = Array.from(gallery.querySelectorAll(context.selectors.answerImageCard))
  const items = cards.flatMap(card => {
    const image = card.querySelector('img')
    if (!image || image.closest(SKIP_NODES)) return []
    const { imageUrl, sourceUrl } = readImageCard(card)
    const caption = serializeImage(image, imageUrl)
    if (!caption) return []

    // Keep the displayed thumbnail in the preview, independent of the full image in Markdown.
    const displayedSource = image.currentSrc || image.getAttribute('src') || ''
    const previewSource = /^data:image\/(?:jpeg|png|gif|webp|avif);base64,/i.test(displayedSource)
      ? displayedSource
      : webUrl(displayedSource, image.baseURI)
    if (imageUrl && previewSource && previewSource !== imageUrl) {
      context.previewImageSources.set(imageUrl, previewSource)
    }

    const markdown = sourceUrl ? `[${caption}](${escapeDestination(sourceUrl)})` : caption
    return [{ markdown, isImage: caption.startsWith('![') }]
  })
  const markdown = items.map((item, index) => {
    const separator = item.isImage && items[index - 1]?.isImage ? ' ' : '\n\n'
    return separator + item.markdown
  }).join('')
  return markdown ? `${markdown}\n\n` : ''
}

function collectChildren(element: Element, context: AnswerSerialization, insideLink: boolean): MarkdownPart[] {
  return Array.from(element.childNodes).flatMap(node => serializeNode(node, context, insideLink)).filter(part => part !== '')
}

function characterReference(character: string): string {
  return `&#x${character.codePointAt(0)!.toString(16)};`
}

function serializeChildren(element: Element, context: AnswerSerialization, insideLink = false): string {
  const parts = collectChildren(element, context, insideLink)
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    if (typeof part !== 'object') continue

    // CommonMark rejects a delimiter between inner punctuation and an outer
    // letter. A character reference gives it a punctuation boundary and
    // renders back to the original character without adding whitespace.
    const before = parts[index - 1]
    const after = parts[index + 1]
    if (typeof before === 'string' && /^[\p{P}\p{S}]/u.test(part.strong)) {
      parts[index - 1] = before.replace(/[^\s\p{P}\p{S}]$/u, characterReference)
    }
    if (typeof after === 'string' && /[\p{P}\p{S}]$/u.test(part.strong)) {
      parts[index + 1] = after.replace(/^[^\s\p{P}\p{S}]/u, characterReference)
    }
    parts[index] = `**${part.strong}**`
  }
  return parts.join('')
}

function serializeNode(node: Node, context: AnswerSerialization, insideLink: boolean): MarkdownPart | MarkdownPart[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ')
    return insideLink ? escapeLinkLabel(text) : text
  }
  if (!(node instanceof Element) || node.matches(SKIP_NODES)) return ''

  const { selectors } = context
  // Google's native text copy skips the image viewer and the interactive map.
  if (node.matches(selectors.answerImageGallery)) return serializeGallery(node, context)
  if (node.matches(selectors.answerMap)) {
    const image = uniqueElement<HTMLImageElement>(node, selectors.answerMapImage)
    return image ? `\n\n${serializeImage(image)}\n\n` : ''
  }
  if (node.matches(selectors.answerUi) || node.matches('[role="region"]')) return ''
  const role = node.getAttribute('role')
  if (node instanceof HTMLTableElement) return serializeTable(node, context, insideLink)
  if (node instanceof HTMLImageElement) return serializeImage(node)
  if (node instanceof HTMLAnchorElement && !insideLink) {
    const destination = webUrl(node.href)
    if (destination) {
      const text = serializeChildren(node, context, true).trim()
      const label = text || escapeLinkLabel(node.getAttribute('aria-label') ?? '')
      return label ? `${text ? '' : ' '}[${label}](${escapeDestination(destination)})` : ''
    }
  }

  // Inline entities, such as place names, appear as buttons embedded in the prose.
  if (node.matches(selectors.inlineTextButton)) return collectChildren(node, context, insideLink)
  if (node.matches('button, [role="button"]')) {
    const image = node.querySelector<HTMLImageElement>('img[alt]:not([alt=""])')
    return image && !image.closest(SKIP_NODES) ? `\n\n${serializeImage(image)}\n\n` : ''
  }

  if (role === 'heading' || /^H[1-6]$/.test(node.tagName)) {
    const level = Number(node.getAttribute('aria-level') ?? node.tagName.slice(1))
    const content = serializeChildren(node, context, insideLink)
    return `\n\n${'#'.repeat(Math.min(6, Math.max(3, level || 3)))} ${content.trim()}\n\n`
  }
  switch (node.tagName) {
    case 'BR': return '\n'
    case 'HR': return '\n\n---\n\n'
    case 'P':
    case 'DIV': {
      const content = serializeChildren(node, context, insideLink).trim()
      return content ? `\n\n${content}\n\n` : ''
    }
    case 'B':
    case 'STRONG': {
      const strong = serializeChildren(node, context, insideLink).trim()
      return strong ? { strong } : ''
    }
    case 'LI': {
      const text = serializeChildren(node, context, insideLink).trim()
      if (!text) return ''
      const prefix = node.parentElement?.tagName === 'OL' ? '1.' : '-'
      return `\n${prefix} ${text.replace(/\n{2,}/g, '\n').replace(/\n/g, '\n  ')}`
    }
    // Inline wrappers must keep their boundaries open to the surrounding text.
    default: return collectChildren(node, context, insideLink)
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

    const previewImageSources = new Map<string, string>()
    const answer = serializeChildren(body, { selectors, previewImageSources }).replace(/\n{3,}/g, '\n\n').trim()
    if (answer) {
      const turn: AiModeTurn = { number: index + 1, question, answer }
      if (previewImageSources.size) turn.previewImageSources = previewImageSources
      conversation.turns.push(turn)
    } else if (index < questions.length - 1) {
      conversation.hasUnreadableTurns = true
    }
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
