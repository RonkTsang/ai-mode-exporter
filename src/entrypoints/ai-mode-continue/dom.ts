const INPUT_PLATE = '[data-xid="aim-mars-input-plate"]'
const QUESTION = 'div.ilZyRc span.VndcI'
const ANSWER = 'div.Zkbeff'
const ANSWER_BODY = ':scope > div > [data-container-id="main-col"][data-xid="VpUvz"]'
// The response toolbar also contains the feedback form, even when it is closed.
const SKIP_NODES = '[hidden], [aria-hidden="true"], [data-ignore-copy], [data-xid="Gd7Hsc"], svg, script, style'

export interface AiModeTurn {
  number: number
  question: string
  answer: string
}

export interface AiModeConversation {
  title: string
  turns: AiModeTurn[]
}

function uniqueElement<T extends Element>(root: ParentNode, selector: string): T | null {
  const nodes = root.querySelectorAll<T>(selector)
  return nodes.length === 1 ? nodes.item(0) : null
}

export function findAiModeInputPlate(root: ParentNode = document): HTMLElement | null {
  return uniqueElement(root, `[role="main"] ${INPUT_PLATE}:has(textarea)`)
}

function serializeTable(table: HTMLTableElement): string {
  const rows = Array.from(table.rows, row => Array.from(row.cells, cell => (
    serializeChildren(cell).trim().replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|')
  )))
  const [header, ...body] = rows
  if (!header) return ''
  const columns = Math.max(...rows.map(row => row.length))
  if (columns === 0) return ''
  const line = (cells: string[]) => `| ${Array.from({ length: columns }, (_, i) => cells[i] ?? '').join(' | ')} |`
  return `\n\n${[line(header), line(Array<string>(columns).fill('---')), ...body.map(line)].join('\n')}\n\n`
}

function serializeChildren(element: Element): string {
  return Array.from(element.childNodes, serializeNode).join('')
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').replace(/\s+/g, ' ')
  if (!(node instanceof Element) || node.matches(SKIP_NODES)) return ''

  const role = node.getAttribute('role')
  if (role === 'region' || role === 'dialog') return ''
  if (node instanceof HTMLTableElement) return serializeTable(node)
  if (node instanceof HTMLImageElement) return node.alt.trim()
  if (node instanceof HTMLAnchorElement && /^https?:$/.test(node.protocol)) {
    const text = serializeChildren(node)
    const label = text.trim() || node.getAttribute('aria-label')
    return label ? `${text.trim() ? '' : ' '}[${label.replace(/[\[\]]/g, '\\$&')}](<${node.href.replace(/>/g, '%3E')}>)` : ''
  }

  if (node.matches('span.jAOkJc[role="button"]:not(.q224lc)')) return serializeChildren(node)
  if (node.matches('button, [role="button"]')) {
    const description = node.querySelector('img[alt]:not([alt=""])')?.getAttribute('alt')?.trim()
    return description ? `\n\n${description}\n\n` : ''
  }

  const content = serializeChildren(node)
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

function readPageTitle(main: Element): string | undefined {
  const heading = uniqueElement(main, ':scope > h1')?.textContent?.trim()
  const subject = heading?.match(/^[^:：]+[:：]\s*(.+)$/s)?.[1]?.trim()
  return subject && main.ownerDocument.title.startsWith(`${subject} - `) ? subject : undefined
}

export function readAiModeConversation(plate: HTMLElement): AiModeConversation {
  const main = plate.closest('[role="main"]')
  if (!main) return { title: '', turns: [] }

  const turns: AiModeTurn[] = []
  let title = readPageTitle(main) ?? ''
  let question = ''
  let number = 0
  for (const element of main.querySelectorAll<HTMLElement>(`${QUESTION}, ${ANSWER}`)) {
    if (element.matches(QUESTION)) {
      question = element.textContent?.trim() ?? ''
      title ||= question.replace(/\s+/g, ' ')
      number += 1
      continue
    }

    const body = element.getAttribute('data-complete') === 'true'
      ? uniqueElement(element, ANSWER_BODY)
      : null
    const answer = body ? serializeChildren(body).replace(/\n{3,}/g, '\n\n').trim() : ''
    if (question && answer) turns.push({ number, question, answer })
    question = ''
  }
  return { title: title.replace(/\s+/g, ' '), turns }
}

export function formatAiModeTranscript({ title, turns }: AiModeConversation): string {
  const transcript = turns.map(({ number, question, answer }) => (
    `## Turn ${number}\n\nQuestion: ${question}\n\nAnswer:\n\n${answer}`
  ))
  return [`# ${title || 'Google AI Mode conversation'}`, ...transcript].join('\n\n') + '\n'
}
