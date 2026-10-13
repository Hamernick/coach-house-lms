import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export type PublicMapProgramPreview = {
  id: string
  title: string
  subtitle: string | null
}

export type PublicMapOrganization = {
  id: string
  name: string
  tagline: string | null
  logoUrl: string | null
  website: string | null
  email: string | null
  latitude: number
  longitude: number
  city: string | null
  state: string | null
  country: string | null
  publicSlug: string | null
  programPreview: PublicMapProgramPreview | null
}

export async function fetchPublicMapOrganizations(): Promise<PublicMapOrganization[]> {
  const supabase = createSupabaseAdminClient()
  const { data: orgRows, error: orgError } = await supabase
    .from("organizations")
    .select("user_id, profile, location_lat, location_lng, public_slug")
    .eq("is_public", true)
    .not("location_lat", "is", null)
    .not("location_lng", "is", null)
    .returns<
      Array<{
        user_id: string
        profile: unknown
        location_lat: number | null
        location_lng: number | null
        public_slug: string | null
      }>
    >()

  if (orgError || !orgRows || orgRows.length === 0) {
    return []
  }

  const orgIds = orgRows.map((row) => row.user_id)
  const { data: programRows } = await supabase
    .from("programs")
    .select("id, user_id, title, subtitle, created_at")
    .in("user_id", orgIds)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .returns<
      Array<{
        id: string
        user_id: string
        title: string | null
        subtitle: string | null
        created_at: string | null
      }>
    >()

  const firstProgramByOrgId = new Map<string, PublicMapProgramPreview>()
  for (const row of programRows ?? []) {
    if (!row.title || !row.title.trim() || firstProgramByOrgId.has(row.user_id)) continue
    firstProgramByOrgId.set(row.user_id, {
      id: row.id,
      title: row.title.trim(),
      subtitle: row.subtitle?.trim() || null,
    })
  }

  return orgRows
    .map((row) => {
      if (row.location_lat == null || row.location_lng == null) return null
      const profile = (row.profile ?? {}) as Record<string, unknown>
      return {
        id: row.user_id,
        name: String(profile["name"] ?? "").trim() || "Organization",
        tagline: typeof profile["tagline"] === "string" ? profile["tagline"].trim() || null : null,
        logoUrl: typeof profile["logoUrl"] === "string" ? profile["logoUrl"] : null,
        website: typeof profile["publicUrl"] === "string" ? profile["publicUrl"] : null,
        email: typeof profile["email"] === "string" ? profile["email"] : null,
        latitude: row.location_lat,
        longitude: row.location_lng,
        city: typeof profile["address_city"] === "string" ? profile["address_city"] : null,
        state: typeof profile["address_state"] === "string" ? profile["address_state"] : null,
        country: typeof profile["address_country"] === "string" ? profile["address_country"] : null,
        publicSlug: typeof row.public_slug === "string" ? row.public_slug : null,
        programPreview: firstProgramByOrgId.get(row.user_id) ?? null,
      } satisfies PublicMapOrganization
    })
    .filter((entry): entry is PublicMapOrganization => entry !== null)
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }))
}
