import { redirect } from "next/navigation"

import { OrgProfileCard } from "@/components/organization/org-profile-card"
import type { OrgDocuments, ProfileTab } from "@/components/organization/org-profile-card/types"
import { resolveRoadmapHeroUrl, resolveRoadmapSections } from "@/lib/roadmap"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { publicSharingEnabled } from "@/lib/feature-flags"
import type { OrgPerson } from "../people/actions"

export const dynamic = "force-dynamic"

export default async function MyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/my-organization")

  // Load organization profile for the current user
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("ein, profile, public_slug, is_public, is_public_roadmap")
    .eq("user_id", user.id)
    .maybeSingle<{
      ein: string | null
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public: boolean | null
      is_public_roadmap: boolean | null
    }>()

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value)

  if (orgRow?.profile) {
    const { nextProfile, changed } = cleanupOrgProfileHtml(profile)
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert({ user_id: user.id, profile: nextProfile as Json }, { onConflict: "user_id" })
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  // Load programs for this organization (by user)
  const { data: programs } = await supabase
    .from("programs")
    .select(
      "id, title, subtitle, location, image_url, duration_label, features, status_label, goal_cents, raised_cents, is_public, created_at, start_date, end_date, address_city, address_state, address_country, cta_label, cta_url",
    )
    .eq("user_id", user.id)
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
    headerUrl: String(profile["headerUrl"] ?? ""),
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
    isPublic: publicSharingEnabled ? Boolean(orgRow?.is_public ?? false) : false,
  }

  const allowedTabs: ProfileTab[] = ["company", "programs", "people", "supporters", "roadmap", "documents"]
  const tabParam = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : ""
  const initialTab = allowedTabs.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : undefined

  const roadmapSections = resolveRoadmapSections(profile).map((section) =>
    publicSharingEnabled ? section : { ...section, isPublic: false },
  )
  const roadmapIsPublic = publicSharingEnabled ? Boolean(orgRow?.is_public_roadmap) : false
  const roadmapPublicSlug = orgRow?.public_slug ?? null
  const roadmapHeroUrl = resolveRoadmapHeroUrl(profile)

  const documentsRaw = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : null
  const verificationRaw = documentsRaw && isRecord(documentsRaw["verificationLetter"]) ? documentsRaw["verificationLetter"] : null
  const documents: OrgDocuments | null = verificationRaw
    ? {
        verificationLetter: {
          name: String((verificationRaw as Record<string, unknown>)["name"] ?? ""),
          path: String((verificationRaw as Record<string, unknown>)["path"] ?? ""),
          size: typeof (verificationRaw as Record<string, unknown>)["size"] === "number" ? ((verificationRaw as Record<string, unknown>)["size"] as number) : null,
          mime: typeof (verificationRaw as Record<string, unknown>)["mime"] === "string" ? ((verificationRaw as Record<string, unknown>)["mime"] as string) : null,
          updatedAt:
            typeof (verificationRaw as Record<string, unknown>)["updatedAt"] === "string"
              ? ((verificationRaw as Record<string, unknown>)["updatedAt"] as string)
              : null,
        },
      }
    : null

  return (
    <div className="flex flex-col gap-6 px-0 sm:px-2 lg:px-0">
      <section>
        <OrgProfileCard
          initial={initialProfile}
          people={people}
          programs={programs ?? []}
          documents={documents}
          roadmapSections={roadmapSections}
          roadmapPublicSlug={roadmapPublicSlug}
          roadmapIsPublic={roadmapIsPublic}
          roadmapHeroUrl={roadmapHeroUrl}
          initialTab={initialTab}
        />
      </section>
    </div>
  )
}
