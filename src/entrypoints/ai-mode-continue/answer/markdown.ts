export function escapeLinkLabel(text: string): string {
  return text.replace(/[\\[\]]/g, '\\$&')
}

export function escapeDestination(url: string): string {
  return url.replace(/[\\()]/g, '\\$&')
}

export function webUrl(value: unknown, base?: string): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value, base)
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}

export function serializeImage(image: HTMLImageElement, source = ''): string {
  const alt = image.alt.replace(/\s+/g, ' ').trim().replace(/[\\[\]*_`~<&]/g, '\\$&')
  if (image.hasAttribute('alt') && !alt) return ''
  const url = source || webUrl(image.currentSrc, image.baseURI) || webUrl(image.getAttribute('src'), image.baseURI)
  return url ? `![${alt}](${escapeDestination(url)})` : alt
}
