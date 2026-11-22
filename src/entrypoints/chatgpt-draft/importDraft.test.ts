import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AiModeTransfer } from '@/common/aiModeTransfer'
import { importChatGptDraft } from './importDraft'

const transfer: AiModeTransfer = { target: 'chatgpt', text: '# AI Mode\n\nQuestion and answer', createdAt: 0 }

function mountComposer() {
  document.body.innerHTML = `
    <main><form data-chatgpt-composer data-composer-placement="home">
      <div data-composer-markdown role="textbox" contenteditable="true" tabindex="0"></div>
      <button type="submit" disabled>Send</button>
    </form></main>
  `
  const editor = document.querySelector<HTMLElement>('[data-composer-markdown]')!
  const submit = document.querySelector<HTMLButtonElement>('button')!
  const rect = new DOMRect(0, 0, 100, 30)
  vi.spyOn(editor, 'getClientRects').mockReturnValue(Object.assign([rect], { item: () => rect }))
  return { editor, submit }
}

describe('ChatGPT draft import', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  it('passes plain Markdown to the editor paste handler without submitting', async () => {
    const { editor, submit } = mountComposer()
    const send = vi.fn()
    submit.addEventListener('click', send)
    editor.addEventListener('paste', event => {
      expect(event.clipboardData?.files).toHaveLength(0)
      expect(event.clipboardData?.getData('text/plain')).toBe(transfer.text)
      editor.textContent = transfer.text
    })

    expect(await importChatGptDraft(transfer, 'id', () => true)).toBe(true)
    expect(editor.textContent).toBe(transfer.text)
    expect(send).not.toHaveBeenCalled()
  })

  it('waits for a native pasted-text attachment to be ready', async () => {
    vi.useFakeTimers()
    const { editor, submit } = mountComposer()
    const paste = vi.fn(() => {
      editor.insertAdjacentHTML('beforebegin', '<div data-composer-attachments data-visible-attachments></div>')
    })
    editor.addEventListener('paste', paste)
    const longTransfer = { ...transfer, text: transfer.text.repeat(500) }
    const complete = vi.fn()
    const result = importChatGptDraft(longTransfer, 'id', () => true).then(complete)

    await vi.advanceTimersByTimeAsync(2_900)
    expect(paste).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(paste).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
    submit.disabled = false
    await vi.advanceTimersByTimeAsync(100)
    await result
    expect(complete).toHaveBeenCalledWith(true)
  })

  it('leaves an existing draft alone', async () => {
    const { editor } = mountComposer()
    const paste = vi.fn()
    editor.textContent = 'A draft already exists'
    editor.addEventListener('paste', paste)

    expect(await importChatGptDraft(transfer, 'id', () => true)).toBe(false)
    expect(editor.textContent).toBe('A draft already exists')
    expect(paste).not.toHaveBeenCalled()
  })
})
