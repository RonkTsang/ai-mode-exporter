import type { CSSProperties, ReactNode } from 'react'
import type { Browser } from 'wxt/browser'

export type MainBridgeStatus = 'ready' | 'unavailable' | 'outdated'

export interface MainBridgeProbe {
  status(): MainBridgeStatus
  mute?(): void
}

export interface HostContext {
  readonly isInvalid: boolean
  onInvalidated(cb: () => void): () => void
  addEventListener(target: Window, type: 'wxt:locationchange', handler: () => void): void
}

export type MessageHandler<TReq = unknown, TRes = unknown> = (
  payload: TReq,
  sender: Browser.runtime.MessageSender,
) => TRes | Promise<TRes>

export interface ShadowUiOptions {
  id: string
  attach: (host: HTMLDivElement) => void
  render: () => ReactNode
  style?: CSSProperties
}

export interface ShadowUiHandle {
  readonly host: HTMLDivElement
  render: (next?: () => ReactNode) => void
  unmount: () => void
}

export interface ServiceScope {
  readonly signal: AbortSignal
  readonly isDisposed: boolean
  onDispose(cleanup: () => void): () => void
  addEventListener<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    listener: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void
  addEventListener<K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void
  setTimeout(fn: () => void, ms?: number): number
  setInterval(fn: () => void, ms?: number): number
  requestAnimationFrame(fn: FrameRequestCallback): number
  observeMutation(target: Node, options: MutationObserverInit, callback: MutationCallback): MutationObserver
  onMessage<TReq = unknown, TRes = unknown>(type: string, handler: MessageHandler<TReq, TRes>): void
  mountShadowUi(options: ShadowUiOptions): ShadowUiHandle
  getMainBridgeStatus(): MainBridgeStatus
}

export interface ContentService<TSnapshot> {
  readonly id: string
  shouldMount(snapshot: TSnapshot): boolean
  mount(scope: ServiceScope, snapshot: TSnapshot): void | Promise<void>
  update?(snapshot: TSnapshot, scope: ServiceScope): void
}

export interface ContentHostOptions<TSnapshot> {
  readonly id: string
  readSnapshot(): TSnapshot
  readonly services: readonly ContentService<TSnapshot>[]
  readonly observe?: {
    target?: Node
    mutationOptions: MutationObserverInit
  }
  readonly mainBridge?: MainBridgeProbe
}

export interface ContentHostHandle {
  readonly instanceId: string
  reconcile(): void
  dispose(): void
}
