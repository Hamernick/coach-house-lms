import { NextResponse } from "next/server"

import {
  isSameOriginRequest,
  searchPublicMapClaimListings,
  submitPublicMapClaimRequest,
} from "@/features/public-map-claims"

const MAX_BODY_BYTES = 16_384

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("query") ?? ""
    const listingOptions = await searchPublicMapClaimListings(query)
    return NextResponse.json({ listingOptions })
  } catch (error) {
    console.error("[public-map-claims] Search failed.", error)
    return NextResponse.json(
      { error: "Listing search is temporarily unavailable." },
      { status: 503 }
    )
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request not allowed." }, { status: 403 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0")
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request is too large." },
      { status: 413 }
    )
  }

  let body: unknown
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 }
      )
    }
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json(
      { error: "Check the form and try again." },
      { status: 400 }
    )
  }

  try {
    const result = await submitPublicMapClaimRequest({ request, value: body })
    if (result.ok) {
      return NextResponse.json(
        { claimId: result.claimId, ok: true },
        { status: 201 }
      )
    }
    if (result.code === "invalid") {
      return NextResponse.json(
        { error: "Check the form and try again." },
        { status: 400 }
      )
    }
    if (result.code === "rate_limited") {
      const retryAfter = String(result.retryAfterSeconds ?? 3600)
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { headers: { "Retry-After": retryAfter }, status: 429 }
      )
    }
  } catch (error) {
    console.error("[public-map-claims] Submission failed.", error)
  }

  return NextResponse.json(
    { error: "Requests are temporarily unavailable." },
    { status: 503 }
  )
}
