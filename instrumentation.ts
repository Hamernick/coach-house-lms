import { logger } from "@/lib/logger"

export const runtime = "nodejs"

export async function register() {
  const isEdgeRuntime =
    typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime === "string"

  if (isEdgeRuntime) {
    return
  }

  const maybeProcess = (globalThis as { process?: NodeJS.Process }).process

  if (!maybeProcess || typeof maybeProcess.on !== "function") {
    return
  }

  const handleRejection = (reason: unknown) => {
    logger.error("unhandled_rejection", reason)
  }

  const handleException = (error: Error) => {
    logger.error("uncaught_exception", error)
  }

  maybeProcess.on("unhandledRejection", handleRejection)
  maybeProcess.on("uncaughtException", handleException)
}
