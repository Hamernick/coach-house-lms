export type LogLevel = "debug" | "info" | "warn" | "error"
export type LogContext = Record<string, unknown>

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return error
}

function emit(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  const payload = JSON.stringify(entry)

  if (level === "error") {
    console.error(payload)
  } else if (level === "warn") {
    console.warn(payload)
  } else {
    console.log(payload)
  }
}

export const logger = {
  debug(message: string, context: LogContext = {}) {
    emit("debug", message, context)
  },
  info(message: string, context: LogContext = {}) {
    emit("info", message, context)
  },
  warn(message: string, context: LogContext = {}) {
    emit("warn", message, context)
  },
  error(message: string, error: unknown, context: LogContext = {}) {
    emit("error", message, { error: serializeError(error), ...context })
  },
}

export function logHandledError(message: string, error: unknown, context?: LogContext) {
  logger.error(message, error, context)
}
