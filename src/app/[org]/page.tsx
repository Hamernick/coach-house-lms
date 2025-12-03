import { notFound } from "next/navigation"

import { PublicOrgBodyBackground } from "@/components/organization/public-org-body-background"
import { OrgProfilePublicCard } from "@/components/organization/org-profile-card"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { ShareButton } from "@/components/shared/share-button"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { OrgPerson } from "@/app/(dashboard)/people/actions"

export const revalidate = 300

export default async function PublicOrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const slug = String(org)
  const admin = createSupabaseAdminClient()

  const { data: orgRow, error } = await admin
    .from("organizations")
    .select("user_id, ein, profile, public_slug, is_public")
    .ilike("public_slug", slug)
    .eq("is_public", true)
    .maybeSingle<{
      user_id: string
      public_slug: string | null
      is_public: boolean | null
      profile: Record<string, unknown> | null
      ein: string | null
    }>()

  if (error || !orgRow) return notFound()

  const profile = (orgRow.profile ?? {}) as Record<string, unknown>

  const { data: programs } = await admin
    .from("programs")
    .select(
      "id, title, subtitle, location, image_url, duration_label, features, status_label, goal_cents, raised_cents, is_public, created_at, start_date, end_date, address_city, address_state, address_country, cta_label, cta_url",
    )
    .eq("user_id", orgRow.user_id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]
  let people: (OrgPerson & { displayImage: string | null })[] = []
  try {
    const admin = createSupabaseAdminClient()
    for (const p of peopleRaw) {
      let displayImage: string | null = null
      if (p.image) {
        if (/^https?:/i.test(p.image) || p.image.startsWith("data:")) {
          displayImage = p.image
        } else {
          const { data: signed } = await admin.storage.from("avatars").createSignedUrl(p.image, 60 * 60)
          displayImage = signed?.signedUrl ?? null
        }
      }
      people.push({ ...p, displayImage })
    }
  } catch {
    people = peopleRaw.map((p) => ({
      ...p,
      displayImage: /^https?:/i.test(p.image ?? "") ? (p.image as string) : null,
    }))
  }

  const initialProfile = {
    name: String(profile["name"] ?? ""),
    description: String(profile["description"] ?? profile["entity"] ?? ""),
    tagline: String(profile["tagline"] ?? ""),
    ein: String(orgRow?.ein ?? profile["ein"] ?? ""),
    rep: String(profile["rep"] ?? ""),
    email: String(profile["email"] ?? ""),
    phone: String(profile["phone"] ?? ""),
    address: String(profile["address"] ?? ""),
    addressStreet: String(profile["address_street"] ?? ""),
    addressCity: String(profile["address_city"] ?? ""),
    addressState: String(profile["address_state"] ?? ""),
    addressPostal: String(profile["address_postal"] ?? ""),
    addressCountry: String(profile["address_country"] ?? ""),
    logoUrl: String(profile["logoUrl"] ?? ""),
    publicUrl: String(profile["publicUrl"] ?? ""),
    twitter: String(profile["twitter"] ?? ""),
    facebook: String(profile["facebook"] ?? ""),
    linkedin: String(profile["linkedin"] ?? ""),
    instagram: String(profile["instagram"] ?? ""),
    youtube: String(profile["youtube"] ?? ""),
    tiktok: String(profile["tiktok"] ?? ""),
    newsletter: String(profile["newsletter"] ?? ""),
    github: String(profile["github"] ?? ""),
    vision: String(profile["vision"] ?? ""),
    mission: String(profile["mission"] ?? ""),
    need: String(profile["need"] ?? ""),
    values: String(profile["values"] ?? ""),
    programs: String(profile["programs"] ?? ""),
    reports: String(profile["reports"] ?? ""),
    boilerplate: String(profile["boilerplate"] ?? ""),
    brandPrimary: String(profile["brandPrimary"] ?? ""),
    brandColors: Array.isArray(profile["brandColors"]) ? (profile["brandColors"] as unknown[]).map((c) => String(c)) : [],
    publicSlug: String(orgRow?.public_slug ?? ""),
    isPublic: Boolean(orgRow?.is_public ?? false),
  }

  const shareLink = `/${slug}`

  return (
    <div className="min-h-screen bg-dot-grid">
      <PublicOrgBodyBackground />
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex w-full items-center justify-end gap-2">
          <ShareButton title={initialProfile.name || "Organization"} url={shareLink} icon="link" />
          <PublicThemeToggle />
        </div>
        <OrgProfilePublicCard profile={initialProfile} people={people} programs={programs ?? []} />
      </div>
    </div>
  )
}
