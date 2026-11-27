import { uniqueElement } from '../dom-utils'
import type { AnswerComponentHandler } from './handler'
import { serializeImage } from './markdown'

export const mapHandler: AnswerComponentHandler = {
  matches: (element, selectors) => element.matches(selectors.answerMap),
  serialize(map, { selectors }) {
    const image = uniqueElement<HTMLImageElement>(map, selectors.answerMapImage)
    return image ? `\n\n${serializeImage(image)}\n\n` : ''
  },
}
