import { afterEach, describe, expect, it } from 'vitest'
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
