import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Browser } from 'wxt/browser'

type RuntimeMessageListener = (
  message: { type?: string } | undefined,
  sender: Browser.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | void

const { messageListeners, addListener, removeListener } = vi.hoisted(() => {
  const listeners = new Set<RuntimeMessageListener>()
  return {
    messageListeners: listeners,
    addListener: vi.fn((listener: RuntimeMessageListener) => {
      listeners.add(listener)
    }),
    removeListener: vi.fn((listener: RuntimeMessageListener) => {
      listeners.delete(listener)
    }),
  }
})

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      onMessage: { addListener, removeListener },
    },
  },
}))

import { startContentHost, type ContentService, type HostContext, type MainBridgeProbe } from './index'

function createFakeContext() {
  let invalid = false
  const invalidatedListeners = new Set<() => void>()
  const locationListeners = new Set<() => void>()

  const ctx: HostContext = {
    get isInvalid() {
      if (invalid) {
        for (const listener of [...invalidatedListeners]) listener()
      }
      return invalid
    },
    onInvalidated(cb) {
      invalidatedListeners.add(cb)
      return () => invalidatedListeners.delete(cb)
    },
    addEventListener(_target, _type, handler) {
      locationListeners.add(handler)
    },
  }

  return {
    ctx,
    invalidate() {
      invalid = true
    },
    emitLocationChange() {
      for (const listener of locationListeners) listener()
    },
  }
}

function dispatchRuntimeMessage(message: { type?: string }): { responded: boolean; response: unknown; asyncResult: boolean | void } {
  let responded = false
  let response: unknown
  let asyncResult: boolean | void = undefined
  for (const listener of [...messageListeners]) {
    asyncResult = listener(message, {} as Browser.runtime.MessageSender, value => {
      responded = true
      response = value
    })
  }
  return { responded, response, asyncResult }
}

describe('startContentHost', () => {
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    document.body.innerHTML = ''
    messageListeners.clear()
    addListener.mockClear()
    removeListener.mockClear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('mounts, updates, and unmounts Shadow UI based on shouldMount', async () => {
    const fake = createFakeContext()
    let active = true
    let label = 'v1-initial'
    const onDispose = vi.fn()
    const update = vi.fn((snapshot: { label: string }, _scope) => {
      uiRender?.(() => <span>{snapshot.label}</span>)
    })
    let uiRender: ((next?: () => React.ReactNode) => void) | undefined

    const service: ContentService<{ active: boolean; label: string }> = {
      id: 'demo',
      shouldMount: snap => snap.active,
      mount(scope, snap) {
        scope.onDispose(onDispose)
        const ui = scope.mountShadowUi({
          id: 'panel',
          attach: host => document.body.append(host),
          render: () => <span>{snap.label}</span>,
        })
        uiRender = ui.render
      },
      update,
    }

    let handle!: ReturnType<typeof startContentHost<{ active: boolean; label: string }>>
    await act(async () => {
      handle = startContentHost(fake.ctx, {
        id: 'ai-mode',
        readSnapshot: () => ({ active, label }),
        services: [service],
      })
    })

    const hostEl = document.querySelector<HTMLElement>('[data-ampk-host="ai-mode"]')
    expect(hostEl?.dataset.ampkService).toBe('demo')
    expect(hostEl?.firstElementChild?.shadowRoot?.textContent).toContain('v1-initial')

    label = 'v1-updated'
    await act(async () => {
      handle.reconcile()
    })
    expect(update).toHaveBeenCalledTimes(1)
    expect(hostEl?.firstElementChild?.shadowRoot?.textContent).toContain('v1-updated')

    active = false
    await act(async () => {
      handle.reconcile()
    })
    expect(onDispose).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-ampk-host="ai-mode"]')).toBeNull()

    handle.dispose()
  })

  it('hands over synchronously from v1 to v2 without muting a ready mainBridge', async () => {
    const v1Ctx = createFakeContext()
    const v2Ctx = createFakeContext()
    const v1Dispose = vi.fn()
    const v1WindowHandler = vi.fn()
    const v1TimerHandler = vi.fn()
    const mute = vi.fn()
    const mainBridge: MainBridgeProbe = { status: () => 'ready', mute }

    vi.useFakeTimers()
    try {
      await act(async () => {
        startContentHost(v1Ctx.ctx, {
          id: 'ai-mode',
          mainBridge,
          readSnapshot: () => ({}),
          services: [{
            id: 'svc',
            shouldMount: () => true,
            mount(scope) {
              scope.onDispose(v1Dispose)
              scope.addEventListener(window, 'click', v1WindowHandler)
              scope.setTimeout(v1TimerHandler, 100)
              scope.onMessage('ping', () => 'v1')
              scope.mountShadowUi({
                id: 'ui',
                attach: host => document.body.append(host),
                render: () => <span>version-1</span>,
              })
            },
          }],
        })
      })

      let v2Handle!: ReturnType<typeof startContentHost>
      await act(async () => {
        v2Handle = startContentHost(v2Ctx.ctx, {
          id: 'ai-mode',
          mainBridge,
          readSnapshot: () => ({}),
          services: [{
            id: 'svc',
            shouldMount: () => true,
            mount(scope) {
              scope.onMessage('ping', () => 'v2')
              scope.mountShadowUi({
                id: 'ui',
                attach: host => document.body.append(host),
                render: () => <span>version-2</span>,
              })
            },
          }],
        })
      })

      expect(v1Dispose).toHaveBeenCalledTimes(1)
      expect(mute).not.toHaveBeenCalled()

      window.dispatchEvent(new MouseEvent('click'))
      vi.advanceTimersByTime(200)
      expect(v1WindowHandler).not.toHaveBeenCalled()
      expect(v1TimerHandler).not.toHaveBeenCalled()

      const hosts = document.querySelectorAll<HTMLElement>('[data-ampk-host="ai-mode"]')
      expect(hosts).toHaveLength(1)
      expect(hosts[0]!.dataset.ampkInstance).toBe(v2Handle.instanceId)
      expect(hosts[0]!.firstElementChild?.shadowRoot?.textContent).toContain('version-2')

      expect(dispatchRuntimeMessage({ type: 'ping' }).response).toBe('v2')

      await act(async () => {
        v2Handle.dispose()
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('purges stale DOM hosts from prior crashed or Firefox-reinjected instances', async () => {
    const stale = document.createElement('div')
    stale.dataset.ampkHost = 'ai-mode'
    stale.dataset.ampkInstance = 'dead-instance'
    document.body.append(stale)

    const otherSite = document.createElement('div')
    otherSite.dataset.ampkHost = 'other-host'
    otherSite.dataset.ampkInstance = 'other-instance'
    document.body.append(otherSite)

    const fake = createFakeContext()
    const handle = startContentHost(fake.ctx, {
      id: 'ai-mode',
      readSnapshot: () => ({}),
      services: [],
    })

    expect(stale.isConnected).toBe(false)
    expect(otherSite.isConnected).toBe(true)
    handle.dispose()
  })

  it('disposes services and mutes mainBridge when context becomes invalid on focus or visibilitychange', async () => {
    const fake = createFakeContext()
    const onDispose = vi.fn()
    const mute = vi.fn()

    await act(async () => {
      startContentHost(fake.ctx, {
        id: 'ai-mode',
        mainBridge: { status: () => 'ready', mute },
        readSnapshot: () => ({}),
        services: [{
          id: 'svc',
          shouldMount: () => true,
          mount(scope) {
            scope.onDispose(onDispose)
            scope.mountShadowUi({
              id: 'ui',
              attach: host => document.body.append(host),
              render: () => <span>alive</span>,
            })
          },
        }],
      })
    })

    fake.invalidate()
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(onDispose).toHaveBeenCalledTimes(1)
    expect(mute).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-ampk-host="ai-mode"]')).toBeNull()
    expect(messageListeners.size).toBe(0)
  })

  it('mutes outdated mainBridge on startup and exposes its status to services', () => {
    const fake = createFakeContext()
    const mute = vi.fn()
    let observedStatus: string | undefined

    const handle = startContentHost(fake.ctx, {
      id: 'ai-mode',
      mainBridge: { status: () => 'outdated', mute },
      readSnapshot: () => ({}),
      services: [{
        id: 'svc',
        shouldMount: () => true,
        mount(scope) {
          observedStatus = scope.getMainBridgeStatus()
        },
      }],
    })

    expect(mute).toHaveBeenCalledTimes(1)
    expect(observedStatus).toBe('outdated')
    handle.dispose()
  })

  it('routes sync and async runtime messages and unregisters them on service unmount', async () => {
    const fake = createFakeContext()
    let active = true

    const handle = startContentHost(fake.ctx, {
      id: 'ai-mode',
      readSnapshot: () => ({ active }),
      services: [{
        id: 'msg-svc',
        shouldMount: snap => snap.active,
        mount(scope) {
          scope.onMessage<{ value: number }, number>('sync', payload => payload.value + 1)
          scope.onMessage<{ value: number }, number>('async', async payload => payload.value * 2)
        },
      }],
    })

    const syncResult = dispatchRuntimeMessage({ type: 'sync', value: 4 } as { type: string })
    expect(syncResult.responded).toBe(true)
    expect(syncResult.response).toBe(5)
    expect(syncResult.asyncResult).toBeUndefined()

    const responses: unknown[] = []
    let keptOpen: boolean | void = false
    for (const listener of [...messageListeners]) {
      keptOpen = listener({ type: 'async', value: 7 } as { type: string }, {} as Browser.runtime.MessageSender, value => {
        responses.push(value)
      })
    }
    expect(keptOpen).toBe(true)
    await vi.waitFor(() => expect(responses).toEqual([14]))

    active = false
    handle.reconcile()

    const afterUnmount = dispatchRuntimeMessage({ type: 'sync', value: 4 } as { type: string })
    expect(afterUnmount.responded).toBe(false)
    handle.dispose()
  })

  it('isolates service errors so sibling services continue mounting and disposing', () => {
    const fake = createFakeContext()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const healthyMount = vi.fn()
    const healthyDispose = vi.fn()

    const handle = startContentHost(fake.ctx, {
      id: 'ai-mode',
      readSnapshot: () => ({}),
      services: [
        {
          id: 'broken',
          shouldMount: () => true,
          mount() {
            throw new Error('boom')
          },
        },
        {
          id: 'healthy',
          shouldMount: () => true,
          mount(scope) {
            healthyMount()
            scope.onDispose(healthyDispose)
          },
        },
      ],
    })

    expect(warn).toHaveBeenCalled()
    expect(healthyMount).toHaveBeenCalledTimes(1)

    handle.dispose()
    expect(healthyDispose).toHaveBeenCalledTimes(1)
  })
})
