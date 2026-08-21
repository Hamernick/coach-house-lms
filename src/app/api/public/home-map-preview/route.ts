import { NextResponse } from "next/server"

import { fetchHomeMapPreviewFeatures } from "@/lib/queries/home-map-preview"

export const runtime = "nodejs"

export async function GET() {
  try {
    const features = await fetchHomeMapPreviewFeatures()
    return NextResponse.json(
      { features },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    )
  } catch {
    return NextResponse.json(
      { features: [] },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      }
    )
  }
}
