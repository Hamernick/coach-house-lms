import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      aria-label={`${weather.city}, ${weather.state}: ${weather.temperatureFahrenheit} degrees. High ${weather.highFahrenheit}, low ${weather.lowFahrenheit}.${freshnessDescription}`}
      data-weather-freshness={weather.freshness}
      className={cn(
        "pointer-events-auto w-fit max-w-44 gap-0 overflow-hidden rounded-2xl py-0 shadow-sm",
        className
      )}
    >
      <CardHeader
        {...getReactGrabLinkedSurfaceProps({
          ownerId: FIND_MAP_WEATHER_CARD_OWNER_ID,
          component: "FindMapWeatherCard",
          source: FIND_MAP_WEATHER_CARD_SOURCE,
          slot: "location",
          surfaceKind: "content",
        })}
        className="min-w-0 gap-0 px-3 pt-2 pb-0.5"
      >
        <CardTitle className="truncate text-xs font-medium">
          {weather.city}, {weather.state}
        </CardTitle>
      </CardHeader>
      <CardContent
        {...getReactGrabLinkedSurfaceProps({
          ownerId: FIND_MAP_WEATHER_CARD_OWNER_ID,
          component: "FindMapWeatherCard",
          source: FIND_MAP_WEATHER_CARD_SOURCE,
          slot: "temperatures",
          surfaceKind: "content",
        })}
        className="flex flex-col items-start gap-1 px-3 pt-0 pb-2 text-xs tabular-nums"
      >
        <span className="text-sm leading-none font-semibold">
          {weather.temperatureFahrenheit}°
        </span>
        <span className="text-muted-foreground leading-none">
          H {weather.highFahrenheit}° L {weather.lowFahrenheit}°
        </span>
      </CardContent>
    </Card>
  )
}
