import { afterEach, describe, expect, it } from 'vitest'
import { findAiModeInputPlate, formatAiModeTranscript, readAiModeConversation } from './dom'

function prompt(text: string, restored = false): string {
  const attributes = restored ? '' : 'role="heading" aria-level="2"'
  const heading = restored ? `<h2>You said: ${text}</h2>` : ''
  return `<div class="ilZyRc">${heading}<span class="VndcI" ${attributes}>${text}</span></div>`
}

function response(markup: string, finished = true): string {
  return `<div class="Zkbeff" data-complete="${finished}">
    <h3 data-ignore-copy>AI Mode reply</h3>
    <div><div data-container-id="main-col" data-xid="VpUvz">${markup}</div></div>
  </div>`
}

describe('AI Mode transcript', () => {
  afterEach(() => {
    document.body.replaceChildren()
    document.title = ''
  })

  it('pairs finished answers, preserves the selected turn numbers, and exports source links and tables', () => {
    document.body.innerHTML = `
      ${prompt('Outside the conversation')}
      <main role="main">
        ${prompt('Initial question')}
        ${response('<p>Initial answer</p>')}
        ${prompt('Compare features', true)}
        ${response(`
          <div role="heading" aria-level="4">Comparison</div>
          <p>A <span role="button" class="jAOkJc">place<script>page details</script></span>
             <a href="https://example.com/source" aria-label="Source"></a>
             <button>Related results</button></p>
          <table><tr><th>Feature</th><th>Status</th></tr><tr><td>A | B</td><td>Live</td></tr></table>
          <div data-ignore-copy>Copy text</div>
        `)}
        ${prompt('Still streaming')}
        ${response('<p>Incomplete answer</p>', false)}
        <div data-xid="aim-mars-input-plate"><textarea></textarea></div>
      </main>`
    const plate = findAiModeInputPlate()
    expect(plate).not.toBeNull()

    if (!plate) throw new Error('Missing AI Mode input plate')
    const { title, turns } = readAiModeConversation(plate)
    expect(title).toBe('Initial question')
    expect(turns.map(turn => turn.question)).toEqual(['Initial question', 'Compare features'])
    const file = formatAiModeTranscript({ title, turns: turns.slice(1) })
    expect(file).toMatch(/^# Initial question\n/)
    expect(file).toContain('## Turn 2')
    expect(file).toContain('#### Comparison')
    expect(file).toContain('place')
    expect(file).toContain('[Source](<https://example.com/source>)')
    expect(file).toContain('| A \\| B | Live |')
    expect(file).not.toMatch(/Question: Initial question|Incomplete answer|Outside the conversation|Copy text|page details|Related results/)
  })

  it('uses the page topic when the conversation heading and browser title agree', () => {
    document.title = 'TwitchCon research - Google Search'
    document.body.innerHTML = `
      <main role="main">
        <h1>AI Mode conversation: TwitchCon research</h1>
        ${prompt('How is TwitchCon going?')}
        ${response('<p>Opening ceremony recap</p>')}
        <div data-xid="aim-mars-input-plate"><textarea></textarea></div>
      </main>`
    const plate = findAiModeInputPlate()
    if (!plate) throw new Error('Missing AI Mode input plate')
    expect(readAiModeConversation(plate).title).toBe('TwitchCon research')
  })

  it('excludes the native feedback form without dropping policy links from the answer', () => {
    document.body.innerHTML = `
      <main role="main">
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
        <div data-xid="aim-mars-input-plate"><textarea></textarea></div>
      </main>`
    const plate = findAiModeInputPlate()
    if (!plate) throw new Error('Missing AI Mode input plate')

    const transcript = formatAiModeTranscript(readAiModeConversation(plate))
    expect(transcript).toContain('[privacy policy](<https://policies.google.com/privacy>)')
    expect(transcript).not.toMatch(/Thanks for letting us know|legal\/answer\/3110420|Bad response/)
  })
})
