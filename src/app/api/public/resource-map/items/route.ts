import { NextResponse } from "next/server"

const BOUNDED_RESOURCE_INDEX_PATH = "/api/public/resource-map/index?limit=200"

export function GET(request: Request) {
  const destination = new URL(BOUNDED_RESOURCE_INDEX_PATH, request.url)
  const response = NextResponse.redirect(destination, 307)
  response.headers.set("Cache-Control", "public, max-age=300")
  return response
}
