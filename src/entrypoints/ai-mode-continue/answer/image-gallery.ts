import { SKIP_ANSWER_NODES } from '../dom-utils'
import type { AnswerComponentHandler } from './handler'
import { escapeDestination, serializeImage, webUrl } from './markdown'

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

export const imageGalleryHandler: AnswerComponentHandler = {
  matches: (element, selectors) => element.matches(selectors.answerImageGallery),
  serialize(gallery, context) {
    const cards = Array.from(gallery.querySelectorAll(context.selectors.answerImageCard))
    const items = cards.flatMap(card => {
      const image = card.querySelector('img')
      if (!image || image.closest(SKIP_ANSWER_NODES)) return []
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
  },
}
