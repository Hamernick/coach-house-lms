import { NextResponse } from "next/server"

import { parseFindMapWeatherCell } from "@/lib/public-map/find-weather-contract"
import { fetchFindMapWeather } from "../../../../../features/find-map/server/weather"

const MAX_WEATHER_REQUEST_BYTES = 256
const RESPONSE_HEADERS = { "X-Content-Type-Options": "nosniff" }

async function readBoundedRequestBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return { text: "", tooLarge: false }
  const decoder = new TextDecoder()
  let byteLength = 0
  let text = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > MAX_WEATHER_REQUEST_BYTES) {
      await reader.cancel()
      return { text: "", tooLarge: true }
    }
    text += decoder.decode(value, { stream: true })
  }
  return { text: text + decoder.decode(), tooLarge: false }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]
  if (contentType?.toLowerCase() !== "application/json") {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { headers: RESPONSE_HEADERS, status: 415 }
    )
  }
  const contentLength = Number(request.headers.get("content-length"))
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_WEATHER_REQUEST_BYTES
  ) {
    return NextResponse.json(
      { error: "Weather request body is too large." },
      { headers: RESPONSE_HEADERS, status: 413 }
    )
  }

  const boundedBody = await readBoundedRequestBody(request)
  if (boundedBody.tooLarge) {
    return NextResponse.json(
      { error: "Weather request body is too large." },
      { headers: RESPONSE_HEADERS, status: 413 }
    )
  }

  let body: unknown
  try {
    body = JSON.parse(boundedBody.text)
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { headers: RESPONSE_HEADERS, status: 400 }
    )
  }

  const cell = parseFindMapWeatherCell(body)
  if (!cell) {
    return NextResponse.json(
      { error: "A valid coarse weather cell is required." },
      { headers: RESPONSE_HEADERS, status: 422 }
    )
  }

  const weather = await fetchFindMapWeather(cell)
  return NextResponse.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=900",
      ...RESPONSE_HEADERS,
    },
  })
}
