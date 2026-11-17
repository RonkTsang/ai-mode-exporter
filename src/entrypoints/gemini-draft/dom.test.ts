import { afterEach, describe, expect, it } from 'vitest'
import { getAiModeAttachmentFilename } from '@/common/aiModeTransfer'
import { findGeminiAttachment } from './dom'

function attachmentCard(displayName: string, tooltipId: string): string {
  return `<uploader-file-preview><div class="file-preview-container" aria-describedby="${tooltipId}"><gem-attachment>
    <span class="gem-attachment-text">${displayName}</span>
    <gem-icon-button class="gem-attachment-close-button"></gem-icon-button>
  </gem-attachment></div></uploader-file-preview>`
}

describe('AI Mode Gemini attachment', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('keeps the source topic in the filename and sanitizes path characters', () => {
    expect(getAiModeAttachmentFilename('Twitch Conf 最新信息与主题', '12345678')).toBe('Twitch Conf 最新信息与主题.md')
    expect(getAiModeAttachmentFilename('Events: Twitch / Berlin?', '12345678')).toBe('Events Twitch Berlin.md')
    expect(getAiModeAttachmentFilename(undefined, '12345678')).toBe('AI-12345678.md')
  })

  it('recognizes a unique Markdown card by its full native tooltip filename', () => {
    const filename = 'Twitch Conf 最新信息与主题.md'
    document.body.innerHTML = `<input-area-v2><uploader-file-preview-container>
      ${attachmentCard('Twitch Conf...与主题', 'markdown-tooltip')}
      ${attachmentCard('Twitch Conf...与主题', 'pdf-tooltip')}
    </uploader-file-preview-container></input-area-v2>
    <div role="tooltip" id="markdown-tooltip">${filename}</div>
    <div role="tooltip" id="pdf-tooltip">Twitch Conf 最新信息与主题.pdf</div>`
    expect(findGeminiAttachment(filename)).not.toBeNull()
    expect(findGeminiAttachment('Twitch Conf 其他信息与主题.md')).toBeNull()
    document.querySelector('uploader-file-preview-container')?.insertAdjacentHTML(
      'beforeend',
      attachmentCard('Twitch Conf...与主题', 'markdown-tooltip'),
    )
    expect(findGeminiAttachment(filename)).toBeNull()
  })
})
