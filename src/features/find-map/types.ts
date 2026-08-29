export type FindMapFeatureName = "find-map"

export type FindMapWeatherSignal =
  | "official_alert"
  | "forecast_threshold"
  | "none"
  | "unknown"

export type FindMapWeatherFreshness = "fresh" | "stale"

export type FindMapWeatherTemperatureSource = "observation" | "forecast"

export type FindMapWeatherSnapshot = {
  city?: string
  state?: string
  temperatureFahrenheit: number
  highFahrenheit?: number
  lowFahrenheit?: number
  temperatureSource: FindMapWeatherTemperatureSource
  signal: FindMapWeatherSignal
  freshness: FindMapWeatherFreshness
  updatedAt: string
}

export type FindMapWeatherResponse = {
  signal: FindMapWeatherSignal
  snapshot: FindMapWeatherSnapshot | null
}

export type FindMapWeatherCell = {
  latitude: number
  longitude: number
}
