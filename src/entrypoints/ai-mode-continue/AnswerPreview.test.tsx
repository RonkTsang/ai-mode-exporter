import { ChakraProvider } from '@chakra-ui/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { system } from '@/components/ui/system'
import { AnswerPreview } from './AnswerPreview'

const answer = [
  '### 对比结果',
  'Read the **[source](https://example.com/report\\(1\\))**.',
  '1. First item\n1. Second item',
  '| Option | Status |\n| --- | --- |\n| A \\| B | Ready |',
  '```js\nconst ready = true\n```',
].join('\n\n')

function renderPreview(markdown: string, summary = false, imageSources?: ReadonlyMap<string, string>): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = renderToStaticMarkup(
    <ChakraProvider value={system}>
      <AnswerPreview markdown={markdown} summary={summary} imageSources={imageSources} />
    </ChakraProvider>,
  )
  return wrapper
}

it('uses readable text in the collapsed summary', () => {
  const summary = renderPreview(`${answer}\n\n![Image description](https://example.com/image.png)`, true).querySelector('p')
  expect(summary?.textContent).toBe('对比结果 Read the source. First item Second item Option Status A | B Ready const ready = true Image description')
  expect(summary?.children).toHaveLength(0)
})

it('renders transcript formatting and images without activating raw HTML', () => {
  const preview = renderPreview(`${answer}\n\n![Image description](https://example.com/image.png)\n\n<iframe src="https://example.com"></iframe>`)

  expect(preview.querySelector('h3')?.textContent).toBe('对比结果')
  expect(preview.querySelector('ol')?.children).toHaveLength(2)
  expect(preview.querySelector('table td')?.textContent).toBe('A | B')
  expect(preview.querySelector('pre code')?.textContent).toBe('const ready = true\n')
  expect(preview.querySelector('strong a')?.getAttribute('href')).toBe('https://example.com/report(1)')
  expect(preview.querySelector('img[alt="Image description"]')?.getAttribute('src')).toBe('https://example.com/image.png')
  expect(preview.querySelector('iframe')).toBeNull()
})

it('shows the page thumbnail as a link to the original article', () => {
  const imageUrl = 'https://example.com/image(1).jpg'
  const articleUrl = 'https://example.com/article'
  const thumbnail = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  const preview = renderPreview(
    `[![TwitchCon photo](https://example.com/image\\(1\\).jpg)](${articleUrl})`,
    false,
    new Map([[imageUrl, thumbnail]]),
  )

  const image = preview.querySelector('a img')
  expect(image?.getAttribute('src')).toBe(thumbnail)
  expect(image?.getAttribute('alt')).toBe('TwitchCon photo')
  expect(image?.getAttribute('loading')).toBe('lazy')
  expect(image?.getAttribute('referrerpolicy')).toBe('no-referrer')
  expect(image?.parentElement?.getAttribute('href')).toBe(articleUrl)
  expect(image?.parentElement?.getAttribute('target')).toBe('_blank')
})

it('groups a paragraph of images into a scrollable row and preserves inline prose', () => {
  const preview = renderPreview([
    '[![First view](https://example.com/first.jpg)](https://example.com/article) ![Second view](https://example.com/second.jpg)',
    'The diagram ![Inline image](https://example.com/diagram.jpg) explains the result.',
  ].join('\n\n'))

  const rows = preview.querySelectorAll('p[data-answer-image-row]')
  expect(rows).toHaveLength(1)
  expect(rows[0]?.getAttribute('tabindex')).toBe('0')
  expect(Array.from(rows[0]?.children ?? [], item => item.tagName)).toEqual(['A', 'IMG'])
  expect(rows[0]?.querySelector('a')?.getAttribute('href')).toBe('https://example.com/article')
  expect(preview.querySelector('p:last-child')?.textContent).toBe('The diagram  explains the result.')
})
