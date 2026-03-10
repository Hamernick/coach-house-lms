import type { NextWebVitalsMetric } from "next/app"

const VERCEL_VITALS_ENDPOINT = "https://vitals.vercel-analytics.com/v1/vitals"

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window === "undefined") return

  const analyticsId = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID

  if (!analyticsId) {
    if (process.env.NODE_ENV !== "production") {
      const rating = (metric as { rating?: string }).rating ?? "n/a"
      console.info(
        `[web-vitals] ${metric.name} (${metric.id}) — ${metric.value.toFixed(2)} (${rating})`,
        metric,
      )
    }
    return
  }

  const rating = (metric as { rating?: string }).rating

  const delta = (metric as { delta?: number }).delta

  const payload: Record<string, unknown> = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value,
  }

  if (rating) {
    payload.rating = rating
  }

  if (typeof delta === "number") {
    payload.delta = delta
  }

  const body = JSON.stringify(payload)

  const blob = new Blob([body], { type: "application/json" })

  if (navigator.sendBeacon) {
    navigator.sendBeacon(VERCEL_VITALS_ENDPOINT, blob)
  } else {
    void fetch(VERCEL_VITALS_ENDPOINT, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
    })
  }
}
