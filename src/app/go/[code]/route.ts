import { createHash, randomUUID } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const TRACKED_CODE_PATTERN = /^[A-Za-z0-9_-]{8,24}$/
const VISITOR_COOKIE = "coach_house_share_visitor"
const VISITOR_PATTERN = /^[A-Za-z0-9_-]{16,128}$/

type TrackedResourceLinkRow = {
  id: string
  target_url: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!TRACKED_CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 })
  }

  const supabase = createSupabaseAdminClient()
  const { data: link } = await supabase
    .from("public_tracked_resource_links")
    .select("id, target_url")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle<TrackedResourceLinkRow>()
  if (!link) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 })
  }

  const existingVisitor = request.cookies.get(VISITOR_COOKIE)?.value
  const visitor =
    existingVisitor && VISITOR_PATTERN.test(existingVisitor)
      ? existingVisitor
      : randomUUID()
  const openedOn = new Date().toISOString().slice(0, 10)
  const visitorHash = createHash("sha256")
    .update(`${link.id}:${openedOn}:${visitor}`)
    .digest("hex")

  await supabase.from("public_tracked_resource_link_daily_opens").upsert(
    {
      link_id: link.id,
      opened_on: openedOn,
      visitor_hash: visitorHash,
    },
    {
      onConflict: "link_id,opened_on,visitor_hash",
      ignoreDuplicates: true,
    }
  )

  const response = NextResponse.redirect(link.target_url, 307)
  response.headers.set("Cache-Control", "private, no-store")
  if (visitor !== existingVisitor) {
    response.cookies.set(VISITOR_COOKIE, visitor, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/go",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }
  return response
}
