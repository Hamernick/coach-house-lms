import { logger } from "@/lib/logger"

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "coach-house-lms"

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logger.info("otelemetry.disabled", {
      service: SERVICE_NAME,
      reason: "OTEL_EXPORTER_OTLP_ENDPOINT not configured",
    })
    return
  }

  try {
    const { registerOTel } = await import("@vercel/otel")
    registerOTel({ serviceName: SERVICE_NAME })
    logger.info("otelemetry.initialized", { service: SERVICE_NAME })
  } catch (error) {
    logger.error("otelemetry.failed", error, { service: SERVICE_NAME })
  }
}
