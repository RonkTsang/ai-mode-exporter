import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLogger } from './logger'

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs prefixed debug messages in dev mode with and without extra arguments', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const defaultLogger = createLogger('ContentHost:ai-mode')
    const devLogger = createLogger('ContentHost', { isDev: () => true })

    defaultLogger.debug('starting')
    expect(debugSpy).toHaveBeenLastCalledWith('[ContentHost:ai-mode] starting')

    const details = { instanceId: 'abc' }
    devLogger.debug('reinjecting', details)
    expect(debugSpy).toHaveBeenLastCalledWith('[ContentHost] reinjecting', details)
    expect(debugSpy).toHaveBeenCalledTimes(2)
  })

  it('suppresses debug logs when isDev returns false', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const logger = createLogger('AI Mode Continue', { isDev: () => false })

    logger.debug('Input plate found', { extra: true })

    expect(debugSpy).not.toHaveBeenCalled()
  })

  it('always logs prefixed warn and error messages regardless of isDev', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createLogger('AI Mode', { isDev: () => false })
    const err = new Error('boom')

    logger.warn('Could not open platform', err)
    logger.error('Failed to set uninstall URL', err, { code: 500 })

    expect(warnSpy).toHaveBeenCalledWith('[AI Mode] Could not open platform', err)
    expect(errorSpy).toHaveBeenCalledWith('[AI Mode] Failed to set uninstall URL', err, { code: 500 })
  })
})
