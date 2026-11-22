import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { createLogger } from '@/utils/logger'
import type { MainBridgeStatus, MessageHandler, ServiceScope, ShadowUiHandle, ShadowUiOptions } from './types'

export interface ManagedServiceScope extends ServiceScope {
  dispose(): void
}

interface CreateScopeParams {
  hostId: string
  serviceId: string
  instanceId: string
  guardActive: () => boolean
  registerMessage: (type: string, handler: MessageHandler) => () => void
  getMainBridgeStatus: () => MainBridgeStatus
}

export function createServiceScope(params: CreateScopeParams): ManagedServiceScope {
  const logger = createLogger(`ContentHost:${params.hostId}`)
  const controller = new AbortController()
  const cleanups = new Set<() => void>()
  let disposed = false

  const isAlive = (): boolean => !disposed && params.guardActive()

  const onDispose = (cleanup: () => void): (() => void) => {
    if (disposed) {
      cleanup()
      return () => {}
    }
    cleanups.add(cleanup)
    return () => {
      cleanups.delete(cleanup)
    }
  }

  const scope: ManagedServiceScope = {
    get signal() {
      return controller.signal
    },
    get isDisposed() {
      return disposed
    },
    onDispose,
    addEventListener(
      target: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ) {
      if (disposed) return
      const wrapped: EventListener = event => {
        if (!isAlive()) return
        if (typeof listener === 'function') listener(event)
        else listener.handleEvent(event)
      }
      target.addEventListener(type, wrapped, { ...options, signal: controller.signal })
    },
    setTimeout(fn: () => void, ms?: number): number {
      if (disposed) return 0
      let id = 0
      const removeCleanup = onDispose(() => window.clearTimeout(id))
      id = window.setTimeout(() => {
        removeCleanup()
        if (isAlive()) fn()
      }, ms)
      return id
    },
    setInterval(fn: () => void, ms?: number): number {
      if (disposed) return 0
      const id = window.setInterval(() => {
        if (isAlive()) fn()
      }, ms)
      onDispose(() => window.clearInterval(id))
      return id
    },
    requestAnimationFrame(fn: FrameRequestCallback): number {
      if (disposed) return 0
      let id = 0
      const removeCleanup = onDispose(() => window.cancelAnimationFrame(id))
      id = window.requestAnimationFrame(timestamp => {
        removeCleanup()
        if (isAlive()) fn(timestamp)
      })
      return id
    },
    observeMutation(target: Node, options: MutationObserverInit, callback: MutationCallback): MutationObserver {
      const observer = new MutationObserver((records, obs) => {
        if (isAlive()) callback(records, obs)
      })
      if (!disposed) {
        observer.observe(target, options)
        onDispose(() => observer.disconnect())
      }
      return observer
    },
    onMessage<TReq = unknown, TRes = unknown>(type: string, handler: MessageHandler<TReq, TRes>) {
      if (disposed) return
      onDispose(params.registerMessage(type, handler as MessageHandler))
    },
    mountShadowUi(options: ShadowUiOptions): ShadowUiHandle {
      const host = document.createElement('div')
      host.dataset.ampkHost = params.hostId
      host.dataset.ampkService = params.serviceId
      host.dataset.ampkInstance = params.instanceId
      host.dataset.ampkUi = options.id
      options.attach(host)

      const root = createRoot(host)
      let currentRender = options.render
      let unmounted = false

      const render = (next?: () => ReactNode): void => {
        if (unmounted || disposed) return
        if (next) currentRender = next
        root.render(<Provider style={options.style}>{currentRender()}</Provider>)
      }

      const unmount = (): void => {
        if (unmounted) return
        unmounted = true
        removeCleanup()
        root.unmount()
        host.remove()
      }

      const removeCleanup = onDispose(unmount)
      render()

      return { host, render, unmount }
    },
    getMainBridgeStatus: params.getMainBridgeStatus,
    dispose() {
      if (disposed) return
      disposed = true
      controller.abort('Content service disposed')
      const pending = Array.from(cleanups).reverse()
      cleanups.clear()
      for (const cleanup of pending) {
        try {
          cleanup()
        } catch (error) {
          logger.warn(`Cleanup failed for "${params.serviceId}"`, error)
        }
      }
    },
  }

  return scope
}
