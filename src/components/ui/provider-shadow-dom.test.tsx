import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { Provider } from './provider-shadow-dom'

it('reuses the shadow root when the provider renders again', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.body.appendChild(document.createElement('div'))
  const app = createRoot(container)
  const attachShadow = vi.spyOn(Element.prototype, 'attachShadow')

  try {
    await act(() => app.render(<Provider><span>First render</span></Provider>))
    const shadowRoot = container.firstElementChild?.shadowRoot
    expect(shadowRoot?.textContent).toContain('First render')
    expect(shadowRoot?.querySelector('style[data-emotion]')).not.toBeNull()

    await act(() => app.render(<Provider><span>Second render</span></Provider>))
    expect(container.firstElementChild?.shadowRoot).toBe(shadowRoot)
    expect(shadowRoot?.textContent).toContain('Second render')
    expect(attachShadow).toHaveBeenCalledTimes(1)
  } finally {
    await act(() => app.unmount())
    attachShadow.mockRestore()
    container.remove()
    vi.unstubAllGlobals()
  }
})
