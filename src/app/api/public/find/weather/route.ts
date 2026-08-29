import { NextResponse } from "next/server"

import { parseFindMapWeatherCell } from "@/features/find-map"
import { fetchFindMapWeather } from "../../../../../features/find-map/server/weather"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const cell = parseFindMapWeatherCell(body)
  if (!cell) {
    return NextResponse.json(
      { error: "A valid coarse weather cell is required." },
      { status: 422 }
    )
  }

  const weather = await fetchFindMapWeather(cell)
  return NextResponse.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=900",
    },
  })
}
