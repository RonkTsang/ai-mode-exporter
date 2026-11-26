import { expect, it } from 'vitest'
import { readAiModePrintImageSources, readAiModePrintJob } from './aiModePrint'

const imageUrl = 'https://example.com/photo.jpg'
const thumbnail = 'data:image/jpeg;base64,AAAA'

it('keeps embedded print images within the session storage budget', () => {
  expect(readAiModePrintImageSources([
    ['https://example.com/over-budget.jpg', `data:image/jpeg;base64,${'A'.repeat(2_000_000)}`],
    [imageUrl, thumbnail],
    [imageUrl, 'data:image/jpeg;base64,BBBB'],
    ['https://example.com/vector.svg', 'data:image/svg+xml;base64,AAAA'],
    ['https://example.com/remote.jpg', 'https://example.com/thumbnail.jpg'],
    ['javascript:alert(1)', thumbnail],
  ])).toEqual([[imageUrl, thumbnail]])
})

it('reads print jobs with and without embedded images', () => {
  const job = { title: 'Photos', text: 'An answer', createdAt: Date.now() }
  expect(readAiModePrintJob(job)).toEqual({ ...job, imageSources: [] })
  expect(readAiModePrintJob({ ...job, imageSources: [[imageUrl, thumbnail]] })).toEqual({
    ...job,
    imageSources: [[imageUrl, thumbnail]],
  })
})
