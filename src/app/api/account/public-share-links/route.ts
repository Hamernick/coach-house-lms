import { revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createTrackedResourceLink } from "@/lib/queries/public-profile-tracked-links"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

const trackedResourceInput = z.object({
  resourceId: z.string().trim().min(1).max(256),
})

export async function POST(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = trackedResourceInput.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 })
  }

  const result = await createTrackedResourceLink({
    ownerProfileId: user.id,
    resourceId: parsed.data.resourceId,
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  revalidateTag("public-profiles", "max")
  return NextResponse.json({
    ok: true,
    code: result.code,
    resourceTitle: result.resourceTitle,
    sharePath: `/go/${encodeURIComponent(result.code)}`,
  })
}
