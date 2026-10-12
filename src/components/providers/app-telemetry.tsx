"use client"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { filterPrivateTelemetry } from "@/lib/telemetry-privacy"

export function AppTelemetry() {
  return (
    <>
      <Analytics beforeSend={filterPrivateTelemetry} />
      <SpeedInsights sampleRate={0.5} beforeSend={filterPrivateTelemetry} />
    </>
  )
}
