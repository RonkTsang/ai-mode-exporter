import type { AiModeDomSelectors } from '../dom-config'
import { SKIP_ANSWER_NODES } from '../dom-utils'
import type { AnswerComponentHandler, AnswerSerializationContext } from './handler'
import { imageGalleryHandler } from './image-gallery'
import { mapHandler } from './map'
import { escapeDestination, escapeLinkLabel, serializeImage, webUrl } from './markdown'

// First match wins. Google marks these components as UI that native text copy skips.
const answerComponentHandlers: readonly AnswerComponentHandler[] = [
  imageGalleryHandler,
  mapHandler,
]

function serializeTable(table: HTMLTableElement, context: AnswerSerializationContext, insideLink: boolean): string {
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

function collectChildren(element: Element, context: AnswerSerializationContext, insideLink: boolean): MarkdownPart[] {
  return Array.from(element.childNodes).flatMap(node => serializeNode(node, context, insideLink)).filter(part => part !== '')
}

function characterReference(character: string): string {
  return `&#x${character.codePointAt(0)!.toString(16)};`
}

function serializeChildren(element: Element, context: AnswerSerializationContext, insideLink = false): string {
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

function serializeNode(node: Node, context: AnswerSerializationContext, insideLink: boolean): MarkdownPart | MarkdownPart[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ')
    return insideLink ? escapeLinkLabel(text) : text
  }
  if (!(node instanceof Element) || node.matches(SKIP_ANSWER_NODES)) return ''

  const { selectors } = context
  const handler = answerComponentHandlers.find(candidate => candidate.matches(node, selectors))
  if (handler) {
    return handler.serialize(node, {
      ...context,
      serializeChildren: element => serializeChildren(element, context, insideLink),
    })
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
    return image && !image.closest(SKIP_ANSWER_NODES) ? `\n\n${serializeImage(image)}\n\n` : ''
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

export function serializeAnswer(
  body: Element,
  selectors: AiModeDomSelectors,
): { markdown: string; previewImageSources: ReadonlyMap<string, string> } {
  const previewImageSources = new Map<string, string>()
  const markdown = serializeChildren(body, { selectors, previewImageSources }).replace(/\n{3,}/g, '\n\n').trim()
  return { markdown, previewImageSources }
}
