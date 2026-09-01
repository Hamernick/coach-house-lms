import { NextResponse, type NextRequest } from "next/server"

import { validatePublicHandle } from "@/features/public-profiles"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

function readAvailability(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get("handle") ?? ""
  const validation = validatePublicHandle(raw)
  if (!validation.valid) {
    return NextResponse.json(
      {
        available: false,
        handle: validation.handle,
        error:
          validation.code === "reserved"
            ? "That username is reserved."
            : "Use 2–48 lowercase letters, numbers, or single hyphens.",
      },
      { status: 200 }
    )
  }

  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const { data, error } = await supabase.rpc("public_handle_availability", {
    p_handle: validation.handle,
  })

  if (error) {
    return NextResponse.json(
      { available: false, error: "Unable to check username right now." },
      { status: 500 }
    )
  }

  const result = readAvailability(data)
  return NextResponse.json(
    {
      available: result?.available === true,
      handle: validation.handle,
      error:
        result?.available === true
          ? undefined
          : result?.code === "reserved"
            ? "That username is reserved."
            : "That username is already taken.",
    },
    { status: 200 }
  )
}
