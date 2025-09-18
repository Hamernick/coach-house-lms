import { logger } from "@/lib/logger"

export async function register() {
  if (typeof process === "undefined") {
    return
  }

  const handleRejection = (reason: unknown) => {
    logger.error("unhandled_rejection", reason)
  }

  const handleException = (error: Error) => {
    logger.error("uncaught_exception", error)
  }

  process.on("unhandledRejection", handleRejection)
  process.on("uncaughtException", handleException)
}
