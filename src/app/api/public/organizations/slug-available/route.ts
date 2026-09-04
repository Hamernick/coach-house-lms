import { NextResponse, type NextRequest } from "next/server"

import { validatePublicHandle } from "@/features/public-profiles"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { RESERVED_PUBLIC_ORGANIZATION_SLUGS } from "@/lib/organization/reserved-public-slugs"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 48).replace(/^-+|-+$/g, "")
}

function readAvailability(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)

  const { searchParams } = new URL(request.url)
  const raw = (searchParams.get("slug") || "").trim()
  if (!raw) return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  const normalized = slugify(raw)
  const validation = validatePublicHandle(normalized)
  if (!validation.valid) {
    return NextResponse.json(
      {
        available: false,
        slug: normalized,
        error:
          validation.code === "reserved" ? "Reserved URL" : "Invalid format",
      },
      { status: 200 }
    )
  }

  if (RESERVED_PUBLIC_ORGANIZATION_SLUGS.has(normalized)) {
    return NextResponse.json(
      { available: false, slug: normalized, error: "Reserved URL" },
      { status: 200 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const targetOrgId = user
    ? (await resolveActiveOrganization(supabase, user.id)).orgId
    : null

  if (targetOrgId) {
    const { data: currentOrganization } = await supabase
      .from("organizations")
      .select("public_slug")
      .eq("user_id", targetOrgId)
      .maybeSingle<{ public_slug: string | null }>()

    if (currentOrganization?.public_slug?.trim().toLowerCase() === normalized) {
      return NextResponse.json(
        { slug: normalized, available: true, current: true },
        { status: 200 },
      )
    }
  }

  let query = supabase
    .from("organizations")
    .select("user_id", { count: "exact", head: true })
    .ilike("public_slug", normalized)

  if (targetOrgId) {
    query = query.neq("user_id", targetOrgId)
  }

  const { count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { slug: normalized, available: false, error: "That URL is already taken." },
      { status: 200 },
    )
  }

  const { data: handleData, error: handleError } = await supabase.rpc(
    "public_handle_availability",
    { p_handle: normalized },
  )
  if (handleError) {
    return NextResponse.json(
      { available: false, error: "Unable to check URL right now." },
      { status: 500 },
    )
  }

  const handleAvailability = readAvailability(handleData)
  const available = handleAvailability?.available === true
  return NextResponse.json(
    {
      slug: normalized,
      available,
      error: available ? undefined : "That URL is already taken.",
    },
    { status: 200 },
  )
}
