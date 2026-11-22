import { browser, type Browser } from 'wxt/browser'
import { createLogger } from '@/utils/logger'
import { createServiceScope, type ManagedServiceScope } from './scope'
import type { ContentHostHandle, ContentHostOptions, HostContext, MessageHandler } from './types'

export const CONTENT_HOST_HANDOVER_EVENT = 'ampk:content-host-handover'

interface HandoverDetail {
  hostId: string
  instanceId: string
}

function purgeStaleHosts(hostId: string, instanceId: string): number {
  let purged = 0
  for (const element of document.querySelectorAll<HTMLElement>('[data-ampk-host]')) {
    if (element.dataset.ampkHost === hostId && element.dataset.ampkInstance !== instanceId) {
      element.remove()
      purged += 1
    }
  }
  return purged
}

export function startContentHost<TSnapshot>(
  ctx: HostContext,
  options: ContentHostOptions<TSnapshot>,
): ContentHostHandle {
  const instanceId = crypto.randomUUID()
  const activeScopes = new Map<string, ManagedServiceScope>()
  const messageHandlers = new Map<string, MessageHandler>()

  let disposed = false
  let checkingInvalidation = false
  let reconcileFrame: number | undefined
  let observer: MutationObserver | undefined

  const logger = createLogger(`ContentHost:${options.id}`)

  logger.debug('starting', { instanceId })

  document.dispatchEvent(
    new CustomEvent<HandoverDetail>(CONTENT_HOST_HANDOVER_EVENT, {
      detail: { hostId: options.id, instanceId },
    }),
  )
  const purged = purgeStaleHosts(options.id, instanceId)
  if (purged > 0) logger.debug('purged stale DOM hosts', { count: purged })

  if (options.mainBridge?.status() === 'outdated') {
    logger.debug('muting outdated mainBridge')
    options.mainBridge.mute?.()
  }

  const dispose = (reason: 'handover' | 'invalidated' | 'manual'): void => {
    if (disposed) return
    disposed = true
    logger.debug('disposing', { instanceId, reason, activeServices: Array.from(activeScopes.keys()) })

    if (reconcileFrame !== undefined) {
      window.cancelAnimationFrame(reconcileFrame)
      reconcileFrame = undefined
    }
    observer?.disconnect()
    observer = undefined

    document.removeEventListener(CONTENT_HOST_HANDOVER_EVENT, onHandover)
    window.removeEventListener('focus', onFocusOrVisibility)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    removeInvalidatedListener()
    browser.runtime.onMessage.removeListener(onRuntimeMessage)

    for (const scope of Array.from(activeScopes.values()).reverse()) {
      scope.dispose()
    }
    activeScopes.clear()
    messageHandlers.clear()

    if (reason === 'invalidated') {
      options.mainBridge?.mute?.()
    }
  }

  const checkContextValid = (): boolean => {
    if (disposed) return false
    checkingInvalidation = true
    try {
      const invalid = ctx.isInvalid
      if (invalid) dispose('invalidated')
      return !invalid && !disposed
    } finally {
      checkingInvalidation = false
    }
  }

  const removeInvalidatedListener = ctx.onInvalidated(() => {
    dispose(checkingInvalidation ? 'invalidated' : 'handover')
  })

  const onHandover = (event: Event): void => {
    const detail = (event as CustomEvent<HandoverDetail>).detail
    if (detail?.hostId === options.id && detail.instanceId !== instanceId) {
      dispose('handover')
    }
  }

  const onFocusOrVisibility = (): void => {
    void checkContextValid()
  }

  const onVisibilityChange = (): void => {
    if (!document.hidden) void checkContextValid()
  }

  const onRuntimeMessage = (
    message: { type?: string } | undefined,
    sender: Browser.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ): boolean | void => {
    if (!checkContextValid() || !message?.type) return
    const handler = messageHandlers.get(message.type)
    if (!handler) return

    try {
      const result = handler(message, sender)
      if (result instanceof Promise) {
        void result.then(sendResponse, error => {
          logger.warn(`Async message "${message.type}" failed`, error)
          sendResponse(undefined)
        })
        return true
      }
      sendResponse(result)
    } catch (error) {
      logger.warn(`Message "${message.type}" failed`, error)
      sendResponse(undefined)
    }
  }

  const registerMessage = (type: string, handler: MessageHandler): (() => void) => {
    messageHandlers.set(type, handler)
    return () => {
      if (messageHandlers.get(type) === handler) {
        messageHandlers.delete(type)
      }
    }
  }

  const reconcile = (): void => {
    reconcileFrame = undefined
    if (!checkContextValid()) return

    const snapshot = options.readSnapshot()
    for (const service of options.services) {
      if (disposed) return
      const existing = activeScopes.get(service.id)
      let mountable = false
      try {
        mountable = service.shouldMount(snapshot)
      } catch (error) {
        logger.warn(`shouldMount failed for "${service.id}"`, error)
      }

      if (!mountable) {
        if (existing) {
          activeScopes.delete(service.id)
          existing.dispose()
          logger.debug(`unmounted service "${service.id}"`, { instanceId })
        }
        continue
      }

      if (!existing) {
        const scope = createServiceScope({
          hostId: options.id,
          serviceId: service.id,
          instanceId,
          guardActive: checkContextValid,
          registerMessage,
          getMainBridgeStatus: () => options.mainBridge?.status() ?? 'unavailable',
        })
        activeScopes.set(service.id, scope)

        const abortMount = (error: unknown): void => {
          logger.warn(`mount failed for "${service.id}"`, error)
          if (activeScopes.get(service.id) === scope) activeScopes.delete(service.id)
          scope.dispose()
        }

        try {
          const result = service.mount(scope, snapshot)
          if (result instanceof Promise) result.catch(abortMount)
          logger.debug(`mounted service "${service.id}"`, { instanceId })
        } catch (error) {
          abortMount(error)
        }
        continue
      }

      try {
        service.update?.(snapshot, existing)
      } catch (error) {
        logger.warn(`update failed for "${service.id}"`, error)
      }
    }
  }

  const scheduleReconcile = (): void => {
    if (disposed || reconcileFrame !== undefined) return
    reconcileFrame = window.requestAnimationFrame(reconcile)
  }

  document.addEventListener(CONTENT_HOST_HANDOVER_EVENT, onHandover)
  window.addEventListener('focus', onFocusOrVisibility)
  document.addEventListener('visibilitychange', onVisibilityChange)
  ctx.addEventListener(window, 'wxt:locationchange', scheduleReconcile)
  browser.runtime.onMessage.addListener(onRuntimeMessage)

  if (options.observe) {
    observer = new MutationObserver(scheduleReconcile)
    observer.observe(options.observe.target ?? document.documentElement, options.observe.mutationOptions)
  }

  reconcile()

  return {
    instanceId,
    reconcile,
    dispose: () => dispose('manual'),
  }
}
