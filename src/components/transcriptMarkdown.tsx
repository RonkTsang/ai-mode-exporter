import type { Element, ElementContent } from 'hast'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const transcriptRemarkPlugins: [typeof remarkGfm] = [remarkGfm]

export const transcriptMarkdownComponents: Components = {
  a: ({ href, children }) => /^https?:\/\//i.test(href ?? '')
    ? <a href={href} target="_blank" rel="noreferrer">{children}</a>
    : <span>{children}</span>,
}

function isImageItem(node: ElementContent): boolean {
  if (node.type !== 'element') return false
  const image = node.tagName === 'a' && node.children.length === 1 ? node.children[0] : node
  return image?.type === 'element' && image.tagName === 'img'
}

export function isTranscriptImageRow(node: Element | undefined): boolean {
  const items = node?.children.filter(child => child.type !== 'text' || child.value.trim())
  return Boolean(items && items.length > 1 && items.every(isImageItem))
}

export function createTranscriptImageComponent(
  imageSources: ReadonlyMap<string, string> | undefined,
  loading: 'lazy' | 'eager',
): NonNullable<Components['img']> {
  return ({ src, alt }) => src && /^https?:\/\//i.test(src)
    ? <img src={imageSources?.get(src) ?? src} alt={alt ?? ''} loading={loading} decoding="async" referrerPolicy="no-referrer" />
    : alt
}
