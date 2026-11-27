import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import { findAiModeInputPlate, findAiModeMain, formatAiModeTranscript, readAiModeConversation } from './dom'
import { defaultAiModeDomProfile } from './dom-config'

function prompt(text: string, restored = false): string {
  const attributes = restored ? '' : 'role="heading" aria-level="2"'
  const heading = restored ? `<h2 data-rfsp>你说：${text}</h2>` : ''
  return `<div data-rfsp>${heading}<div><span tabindex="-1" ${attributes}>${text}</span></div></div>`
}

function response(markup: string, finished = true): string {
  return `<div data-scope-id><div data-complete="${finished}">
    <header><h3 data-ignore-copy>AI Mode reply</h3></header>
    <div><section><div data-container-id="main-col">${markup}</div></section></div>
  </div></div>`
}

function mountConversation(markup: string, heading = ''): HTMLElement {
  document.body.innerHTML = `
    <main role="main">
      ${heading}
      ${prompt('Outside the conversation')}
      <div data-xid="aim-mars-turn-root"><div data-tr-rsts>${markup}</div></div>
      <div data-xid="aim-mars-input-plate"><textarea></textarea></div>
    </main>`
  const plate = findAiModeInputPlate()
  if (!plate) throw new Error('Missing AI Mode input plate')
  return plate
}

describe('AI Mode mount', () => {
  afterEach(() => document.body.replaceChildren())

  it.each([
    '<div data-xid="aim-mars-input-plate"><textarea></textarea></div>',
    '<div data-xid="aim-mars-turn-root"></div>',
  ])('selects the main with AI Mode content alongside an empty main', markup => {
    document.body.innerHTML = `<div role="main"></div><div role="main" id="ai-mode">${markup}</div>`

    expect(findAiModeMain()?.id).toBe('ai-mode')
  })

  it('does not select a main without AI Mode content', () => {
    document.body.innerHTML = '<div role="main"><textarea></textarea></div>'

    expect(findAiModeMain()).toBeNull()
  })

  it('does not choose between two mains with AI Mode content', () => {
    document.body.innerHTML = `
      <div role="main"><div data-xid="aim-mars-turn-root"></div></div>
      <div role="main"><div data-xid="aim-mars-input-plate"><textarea></textarea></div></div>`

    expect(findAiModeMain()).toBeNull()
  })
})

describe('AI Mode transcript', () => {
  afterEach(() => {
    document.body.replaceChildren()
    document.title = ''
  })

  it('reads available answer text and preserves selected turn numbers, source links, and tables', () => {
    const plate = mountConversation(`
      <section>${prompt('Initial question')}${response('<p>Initial answer</p>')}</section>
      <div data-scope-id>
        ${prompt('Compare features', true)}
        <div>
          <h3 data-ignore-copy>AI Mode reply</h3>
          <div data-container-id="main-col">
            <div role="heading" aria-level="4">Comparison</div>
            <p>A <span><span role="button" tabindex="0">place<script>page details</script></span></span>
               <a href="https://example.com/source" aria-label="Source"></a>
               <button>Related results</button></p>
            <table><tr><th>Feature</th><th>Status</th></tr><tr><td>A | B</td><td>Live</td></tr></table>
            <div data-ignore-copy>Copy text</div>
            <div data-xid="Gd7Hsc"><p>Give feedback</p></div>
          </div>
        </div>
      </div>
      <div>${prompt('Still streaming')}${response('<p>Partial answer</p>', false)}</div>
      <div>${prompt('Waiting for content')}${response('', false)}</div>
    `)
    const { title, turns, hasUnreadableTurns } = readAiModeConversation(plate)
    expect(title).toBe('Initial question')
    expect(turns.map(turn => turn.question)).toEqual(['Initial question', 'Compare features', 'Still streaming'])
    expect(turns[2]?.answer).toBe('Partial answer')
    expect(hasUnreadableTurns).toBe(false)
    const file = formatAiModeTranscript({ title, turns: turns.filter(turn => turn.number === 2) })
    expect(file).toMatch(/^# Initial question\n/)
    expect(file).toContain('## Turn 2')
    expect(file).toContain('#### Comparison')
    expect(file).toContain('place')
    expect(file).toContain('[Source](https://example.com/source)')
    expect(file).toContain('| A \\| B | Live |')
    expect(file).not.toMatch(/Question: Initial question|Partial answer|Outside the conversation|Copy text|page details|Related results|Give feedback/)
  })

  it('uses the supplied selectors to find the input, pair turns, and filter answer controls', () => {
    const selectors = {
      ...defaultAiModeDomProfile.selectors,
      main: '[data-main]',
      inputPlate: '[data-input]:has(textarea)',
      conversationRoot: '[data-conversation]',
      turnScope: '[data-turn]',
      questionBlock: '[data-question]',
      liveQuestion: '[data-question-text]',
      answerHeading: '[data-answer-heading]',
      answerBody: '[data-answer]',
      answerUi: '[data-feedback]',
    }
    document.body.innerHTML = `
      <div data-input><textarea></textarea></div>
      <main data-main>
        <div data-conversation><section data-turn>
          <div data-question><span data-question-text>Question</span></div>
          <div data-answer-heading>Reply</div>
          <div data-answer><p>Answer</p><div data-feedback>Feedback</div></div>
        </section></div>
        <div data-input><textarea></textarea></div>
      </main>`

    const plate = findAiModeInputPlate(document, selectors)
    if (!plate) throw new Error('Missing configured input plate')
    expect(readAiModeConversation(plate, selectors)).toEqual({
      title: 'Question',
      turns: [{ number: 1, question: 'Question', answer: 'Answer' }],
      hasUnreadableTurns: false,
    })
  })

  it('preserves links whose URLs contain spaces and Markdown delimiters', () => {
    const plate = mountConversation(`
      <div>
        ${prompt('Where is the report?')}
        ${response('<p>See the <a href="https://example.com/sales report)?q=Q(1&#92;2">report</a>.</p>')}
      </div>
    `)

    const transcript = formatAiModeTranscript(readAiModeConversation(plate))
    expect(transcript).toContain('[report](https://example.com/sales%20report\\)?q=Q\\(1\\\\2).')
  })

  it('omits highlight boundary labels while preserving the highlighted answer and its source', () => {
    const answer = [
      '<div>Google is offering <mark>',
      '<span data-rfsp data-skip-highlighting> [突显文字开始] </span>',
      'up to <strong>50% off</strong> annual plans',
      '<span data-rfsp data-skip-highlighting> [突显文字结束] </span>',
      '</mark>.<a href="https://example.com/offer" aria-label="Source"></a></div>',
    ].join('')
    const plate = mountConversation(`
      <div>${prompt('What is the Black Friday offer?')}${response(answer)}</div>
    `)

    const transcript = formatAiModeTranscript(readAiModeConversation(plate))

    expect(transcript).toContain('Google is offering up to **50% off** annual plans. [Source](https://example.com/offer)')
    expect(transcript).not.toMatch(/突显文字开始|突显文字结束/)
  })

  it('preserves strong emphasis around punctuation in continuous Chinese text', () => {
    const theme = '“更多创造、连接与游玩的方式”（More Ways to Create, Connect, and Play）'
    const answer = [
      '<div><strong>TwitchCon</strong>。本届大会',
      '<span>以<strong>', theme, '<!-- render marker --></strong></span>',
      '<span>为核心主题</span>。</div>',
    ].join('')
    const plate = mountConversation(`<div>${prompt('TwitchCon 的主题是什么？')}${response(answer)}</div>`)
    const transcript = formatAiModeTranscript(readAiModeConversation(plate))

    const rendered = document.createElement('div')
    rendered.innerHTML = renderToStaticMarkup(createElement(Markdown, { children: transcript }))

    expect(Array.from(rendered.querySelectorAll('strong'), element => element.textContent)).toEqual(['TwitchCon', theme])
    expect(rendered.querySelector('p:last-child')?.textContent).toBe(`TwitchCon。本届大会以${theme}为核心主题。`)
  })

  it('exports ordinary images, Google image viewer cards, and a single map snapshot', () => {
    const answer = [
      '<p>Before the gallery <a href="https://example.com/diagram"><img src="/media/diagram.png" alt="Diagram [1]"></a>.</p>',
      '<div data-viewer-group data-ignore-copy>',
      '<span role="button" data-im=\'[0,"id",["https://example.com/thumb.jpg",100,200],["https://example.com/original(1).jpg",400,800],{"2003":[null,null,"https://example.com/article"]}]\'>',
      '<img src="data:image/jpeg;base64,AAAA" alt="TwitchCon photo">',
      '</span>',
      '<span role="button" data-im=\'[0,"id",["https://example.com/thumb-2.jpg",100,200],["javascript:alert(1)",400,800],{}]\'>',
      '<img src="data:image/jpeg;base64,AAAA" alt="Thumbnail fallback">',
      '</span>',
      '<span role="button" data-im="invalid"><img src="https://example.com/rendered.png" alt="DOM fallback"></span>',
      '<span role="button" data-im="invalid" hidden><img src="https://example.com/hidden.png" alt="Hidden card"></span>',
      '</div>',
      '<div role="region" data-artifact-type="map"><img src="blob:https://example.com/tile"><img src="https://www.google.com/maps/vt/data=preview" alt="地图"></div>',
      '<button><img src="https://example.com/favicon.png" alt="">Show sources</button>',
      '<div data-ignore-copy><img src="https://example.com/toolbar.png" alt="Toolbar img"></div>',
      '<div role="region"><img src="https://example.com/other-region.png" alt="Other region"></div>',
      '<p><img src="blob:https://example.com/local" alt="Unavailable image"></p>',
    ].join('')
    const plate = mountConversation(`<div>${prompt('Show images')}${response(answer)}</div>`)
    const conversation = readAiModeConversation(plate)
    const transcript = formatAiModeTranscript(conversation)
    const rendered = document.createElement('div')
    rendered.innerHTML = renderToStaticMarkup(createElement(Markdown, { children: transcript }))

    expect(conversation.turns[0]?.previewImageSources).toEqual(new Map([
      ['https://example.com/original(1).jpg', 'data:image/jpeg;base64,AAAA'],
      ['https://example.com/thumb-2.jpg', 'data:image/jpeg;base64,AAAA'],
    ]))
    expect(Array.from(rendered.querySelectorAll('img'), image => [image.alt, image.getAttribute('src')])).toEqual([
      ['Diagram [1]', new URL('/media/diagram.png', document.baseURI).href],
      ['TwitchCon photo', 'https://example.com/original(1).jpg'],
      ['Thumbnail fallback', 'https://example.com/thumb-2.jpg'],
      ['DOM fallback', 'https://example.com/rendered.png'],
      ['地图', 'https://www.google.com/maps/vt/data=preview'],
    ])
    expect(Array.from(rendered.querySelectorAll('a img'), image => image.parentElement?.getAttribute('href'))).toEqual([
      'https://example.com/diagram',
      'https://example.com/article',
    ])
    const gallery = rendered.querySelector('img[alt="TwitchCon photo"]')?.closest('p')
    expect(Array.from(gallery?.querySelectorAll('img') ?? [], image => image.alt)).toEqual([
      'TwitchCon photo', 'Thumbnail fallback', 'DOM fallback',
    ])
    expect(rendered.textContent).toContain('Unavailable image')
    expect(transcript).not.toMatch(/base64|blob:|javascript:|Hidden card|Show sources|Toolbar img|Other region/)
  })

  it('keeps supported reply components in order and skips hidden or unreadable components', () => {
    const answer = [
      '<p>Before</p>',
      '<div data-viewer-group data-ignore-copy>',
      '<span role="button" data-im="invalid"><img src="https://example.com/gallery.png" alt="Gallery"></span>',
      '</div>',
      '<div hidden data-viewer-group data-ignore-copy>',
      '<span role="button" data-im="invalid"><img src="https://example.com/hidden.png" alt="Hidden gallery"></span>',
      '</div>',
      '<p>Between</p>',
      '<div role="region" data-artifact-type="map">',
      '<img src="https://www.google.com/maps/vt/visible" alt="Map"><button>Map controls</button>',
      '</div>',
      '<div role="region" data-artifact-type="map">',
      '<img src="https://www.google.com/maps/vt/first" alt="First map">',
      '<img src="https://www.google.com/maps/vt/second" alt="Second map">',
      '</div>',
      '<p>After</p>',
    ].join('')
    const plate = mountConversation(`<div>${prompt('Show the area')}${response(answer)}</div>`)

    expect(readAiModeConversation(plate).turns[0]?.answer).toBe([
      'Before',
      '![Gallery](https://example.com/gallery.png)',
      'Between',
      '![Map](https://www.google.com/maps/vt/visible)',
      'After',
    ].join('\n\n'))
  })

  it('uses configured component selectors and lets the first match own the subtree', () => {
    const plate = mountConversation(`<div>${prompt('Show the area')}${response([
      '<section data-gallery data-map>',
      '<img data-snapshot src="https://example.com/overlap.png" alt="Overlapping snapshot">',
      '</section>',
      '<section data-map><img data-snapshot src="https://example.com/map.png" alt="Map"></section>',
    ].join(''))}</div>`)
    const selectors = {
      ...defaultAiModeDomProfile.selectors,
      answerImageGallery: '[data-gallery]',
      answerMap: '[data-map]',
      answerMapImage: 'img[data-snapshot]',
    }

    expect(readAiModeConversation(plate, selectors).turns[0]?.answer).toBe('![Map](https://example.com/map.png)')
  })

  it.each([
    { tag: 'ul', marker: '-' },
    { tag: 'ol', marker: '1.' },
  ])('omits empty $tag items from the transcript', ({ tag, marker }) => {
    const list = [
      `<${tag}>`,
      '<li><span aria-hidden="true">Placeholder</span></li>',
      '<li><strong>First answer</strong></li>',
      '<li><br>&nbsp;</li>',
      '<li><a href="https://example.com/" aria-label="Source"></a></li>',
      '<li><svg></svg></li>',
      `</${tag}>`,
    ].join('')
    const plate = mountConversation(`<div>${prompt('List the answers')}${response(list)}</div>`)

    const { turns } = readAiModeConversation(plate)

    expect(turns[0]?.answer).toBe(`${marker} **First answer**\n${marker} [Source](https://example.com/)`)
  })

  it('uses the page topic when the conversation heading and browser title agree', () => {
    document.title = 'TwitchCon research - Google Search'
    const plate = mountConversation(`
      <div>${prompt('How is TwitchCon going?')}${response('<p>Opening ceremony recap</p>')}</div>
    `, '<h1>AI Mode conversation: TwitchCon research</h1>')
    expect(readAiModeConversation(plate).title).toBe('TwitchCon research')
  })

  it('excludes the native feedback form without dropping policy links from the answer', () => {
    const plate = mountConversation(`
      <div>
        ${prompt('What does the policy say?')}
        ${response(`
          <p>See the <a href="https://policies.google.com/privacy">privacy policy</a>.</p>
          <div data-xid="Gd7Hsc">
            <button>Bad response</button>
            <div style="display: none">
              <p>Thanks for letting us know</p>
              <a href="https://support.google.com/legal/answer/3110420">Make a legal removal request</a>
            </div>
          </div>
        `)}
      </div>`)

    const transcript = formatAiModeTranscript(readAiModeConversation(plate))
    expect(transcript).toContain('[privacy policy](https://policies.google.com/privacy)')
    expect(transcript).not.toMatch(/Thanks for letting us know|legal\/answer\/3110420|Bad response/)
  })

  it('pairs a question and reply rendered in separate branches of the turn list', () => {
    const plate = mountConversation(`
      <div><div><div data-rfsp="1"><span role="heading" aria-level="2" tabindex="-1">Show TwitchCon news</span></div></div></div>
      <div data-container-id="request-result"></div>
      <div data-processed>
        <div data-scope-id="turn">
          <div data-subtree><div>
            <h3 data-ignore-copy data-rfsp="1">AI 模式针对“Show TwitchCon news”的回复</h3>
            <div><div data-container-id="main-col">
              <div data-container-id="7">
                <div data-viewer-group data-ignore-copy>
                  <span role="button" data-im="invalid"><img src="https://example.com/twitchcon.jpg" alt="TwitchCon"></span>
                </div>
                <p>Opening Ceremony highlights</p>
                <table><tr><th>Event</th></tr><tr><td>TwitchCon Europe</td></tr></table>
              </div>
            </div></div>
            <aside>Related results</aside>
          </div></div>
        </div>
      </div>
      <div>${prompt('Follow-up')}${response('<p>Follow-up answer</p>')}</div>
    `)

    const conversation = readAiModeConversation(plate)
    expect(conversation.hasUnreadableTurns).toBe(false)
    expect(conversation.turns.map(turn => turn.question)).toEqual(['Show TwitchCon news', 'Follow-up'])
    expect(conversation.turns[0]?.answer).toMatch(/^!\[TwitchCon\]\(https:\/\/example\.com\/twitchcon\.jpg\)\s+Opening Ceremony highlights/)
    expect(conversation.turns[0]?.answer).toContain('| TwitchCon Europe |')
    expect(conversation.turns[0]?.answer).not.toContain('Related results')
  })

  it('rejects split replies with a different turn reference and logs counts without conversation content', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const plate = mountConversation(`
        <div><div data-rfsp="1"><span role="heading" aria-level="2">Repeated question</span></div></div>
        <div><div data-scope-id="turn">
          <h3 data-ignore-copy data-rfsp="2">AI Mode reply to “Repeated question”</h3>
          <div data-container-id="main-col"><p>Another turn's answer</p></div>
        </div></div>
      `)

      expect(readAiModeConversation(plate)).toEqual({
        title: 'Repeated question',
        turns: [],
        hasUnreadableTurns: true,
      })
      expect(warn.mock.calls).toEqual([[
        '[AI Mode Continue] Could not read all conversation turns',
        { questionCount: 1, exportedTurnCount: 0, unmatchedAnswerMarkerCount: 2 },
      ]])
    } finally {
      warn.mockRestore()
    }
  })

  it('skips incomplete or ambiguous pairs without borrowing an answer from a neighboring turn', () => {
    const plate = mountConversation(`
      <div>${prompt('Question with a missing answer')}</div>
      <div>${response('<p>Answer with a missing question</p>')}</div>
      <div>${prompt('Ambiguous question')}${response('<p>First answer</p>')}${response('<p>Second answer</p>')}</div>
      <div>${prompt('Valid question')}${response('<p>Valid answer</p>')}</div>
      <div>${prompt('Waiting for an answer')}</div>`)

    const { turns, hasUnreadableTurns } = readAiModeConversation(plate)
    expect(turns).toEqual([{ number: 3, question: 'Valid question', answer: 'Valid answer' }])
    expect(hasUnreadableTurns).toBe(true)
  })
})
