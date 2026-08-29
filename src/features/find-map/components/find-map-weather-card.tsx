import { Card, CardContent } from "@/components/ui/card"
import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"
import { cn } from "@/lib/utils"

import type { FindMapWeatherSnapshot } from "../types"

const FIND_MAP_WEATHER_CARD_SOURCE =
  "src/features/find-map/components/find-map-weather-card.tsx"
const FIND_MAP_WEATHER_CARD_OWNER_ID = "find-map-weather-card:current-location"

export function FindMapWeatherCard({
  className,
  weather,
}: {
  className?: string
  weather: FindMapWeatherSnapshot | null
}) {
  if (!weather) return null

  const freshnessDescription =
    weather.freshness === "stale" ? " Weather data may be delayed." : ""

  return (
    <Card
      {...getReactGrabOwnerProps({
        ownerId: FIND_MAP_WEATHER_CARD_OWNER_ID,
        component: "FindMapWeatherCard",
        source: FIND_MAP_WEATHER_CARD_SOURCE,
        slot: "card",
        primitiveImport: "@/components/ui/card",
        notes:
          "Compact current-location weather summary on the public Find map.",
      })}
      aria-label={`Current temperature: ${weather.temperatureFahrenheit} degrees.${freshnessDescription}`}
      role="status"
      data-weather-freshness={weather.freshness}
      className={cn(
        "pointer-events-auto h-10 min-w-14 shrink-0 gap-0 overflow-hidden rounded-xl py-0 shadow-sm",
        className
      )}
    >
      <CardContent
        {...getReactGrabLinkedSurfaceProps({
          ownerId: FIND_MAP_WEATHER_CARD_OWNER_ID,
          component: "FindMapWeatherCard",
          source: FIND_MAP_WEATHER_CARD_SOURCE,
          slot: "temperature",
          surfaceKind: "content",
        })}
        className="flex h-full w-full items-center justify-center px-3 py-0 text-sm leading-none font-semibold tabular-nums first:pt-0"
      >
        {weather.temperatureFahrenheit}°
      </CardContent>
    </Card>
  )
}
