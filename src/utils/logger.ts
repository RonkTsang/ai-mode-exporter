export interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

export interface LoggerOptions {
  isDev?: () => boolean
}

export function createLogger(scope: string, options?: LoggerOptions): Logger {
  const prefix = `[${scope}]`
  const isDev = options?.isDev ?? (() => import.meta.env.DEV)

  return {
    debug(message, ...args) {
      if (!isDev()) return
      console.debug(`${prefix} ${message}`, ...args)
    },
    warn(message, ...args) {
      console.warn(`${prefix} ${message}`, ...args)
    },
    error(message, ...args) {
      console.error(`${prefix} ${message}`, ...args)
    },
  }
}
