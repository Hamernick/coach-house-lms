import { logger } from "@/lib/logger"

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "coach-house-lms"

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  const hasOtelExporter =
    Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT) ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT)
  const isVercelRuntime = process.env.VERCEL === "1"

  if (!isVercelRuntime && !hasOtelExporter) {
    logger.info("otelemetry.disabled", {
      service: SERVICE_NAME,
      reason: "Vercel runtime or OTLP exporter not configured",
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
