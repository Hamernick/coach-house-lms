import { revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

const affiliationInputSchema = z.object({
  organizationId: z.string().uuid(),
  visible: z.boolean(),
})

type MembershipRow = {
  org_id: string
  role: "owner" | "admin" | "staff" | "board" | "member"
}

type OrganizationRow = {
  user_id: string
  profile: unknown
  public_slug: string | null
  is_public: boolean | null
}

function profileString(profile: unknown, ...keys: string[]) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return null
  }
  const record = profile as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

async function authenticatedClient(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { response, supabase, user: error ? null : user }
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await authenticatedClient(request)
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: membershipRows, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("org_id, role")
    .eq("member_id", user.id)
    .returns<MembershipRow[]>()

  if (membershipError) {
    return NextResponse.json(
      { error: "Unable to load organization memberships." },
      { status: 500 }
    )
  }

  const organizationIds = Array.from(
    new Set([user.id, ...(membershipRows ?? []).map((row) => row.org_id)])
  )

  const [organizationResult, publicResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("user_id, profile, public_slug, is_public")
      .in("user_id", organizationIds)
      .returns<OrganizationRow[]>(),
    supabase
      .from("public_person_organization_affiliations")
      .select("organization_id")
      .eq("profile_id", user.id)
      .returns<Array<{ organization_id: string }>>(),
  ])

  if (organizationResult.error || publicResult.error) {
    return NextResponse.json(
      { error: "Unable to load public affiliations." },
      { status: 500 }
    )
  }

  const organizationRows = organizationResult.data
  const publicRows = publicResult.data

  const memberships = new Map<
    string,
    "owner" | "admin" | "staff" | "board" | "member"
  >((membershipRows ?? []).map((row) => [row.org_id, row.role]))
  memberships.set(user.id, "owner")
  const selectedIds = new Set(
    (publicRows ?? []).map((row) => row.organization_id)
  )

  return NextResponse.json({
    affiliations: (organizationRows ?? [])
      .map((organization) => ({
        organizationId: organization.user_id,
        name: profileString(organization.profile, "name") ?? "Organization",
        logoUrl: profileString(
          organization.profile,
          "logoUrl",
          "logo_url",
          "brandMarkUrl",
          "brand_mark_url"
        ),
        publicSlug: organization.public_slug,
        organizationIsPublic: Boolean(organization.is_public),
        role: memberships.get(organization.user_id) ?? "member",
        visible: selectedIds.has(organization.user_id),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  })
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await authenticatedClient(request)
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = affiliationInputSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid affiliation." }, { status: 400 })
  }

  const { data, error } = await supabase.rpc("set_person_public_affiliation", {
    p_organization_id: parsed.data.organizationId,
    p_visible: parsed.data.visible,
  })
  const result =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null

  if (error || result?.ok !== true) {
    const message =
      result?.code === "not_member"
        ? "That organization membership could not be verified."
        : "Unable to update the public affiliation."
    return NextResponse.json({ error: message }, { status: 403 })
  }

  revalidateTag("public-profiles", "max")
  return NextResponse.json({ ok: true, visible: parsed.data.visible })
}
