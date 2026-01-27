import { redirect } from "next/navigation"

import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { OrgProfileCard } from "@/components/organization/org-profile-card"
import type { FormationStatus, ProfileTab } from "@/components/organization/org-profile-card/types"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { normalizePersonCategory } from "@/lib/people/categories"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { OrgPerson } from "@/actions/people"

export const dynamic = "force-dynamic"

export default async function MyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tabParam = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : ""
  const programIdParam = typeof resolvedSearchParams?.programId === "string" ? resolvedSearchParams.programId : ""
  if (tabParam === "roadmap") redirect("/roadmap")
  if (tabParam === "documents") redirect("/my-organization/documents")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/my-organization")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)

  // Load organization profile for the current user
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("ein, profile, public_slug, is_public")
    .eq("user_id", orgId)
    .maybeSingle<{
      ein: string | null
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public: boolean | null
    }>()

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  if (orgRow?.profile) {
    const { nextProfile, changed } = cleanupOrgProfileHtml(profile)
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert({ user_id: orgId, profile: nextProfile as Json }, { onConflict: "user_id" })
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  // Load programs for this organization (by user)
  const { data: programs } = await supabase
    .from("programs")
    .select(
      "id, title, subtitle, description, location, location_type, location_url, team_ids, image_url, duration_label, features, status_label, goal_cents, raised_cents, is_public, created_at, start_date, end_date, address_city, address_state, address_country, cta_label, cta_url",
    )
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })

  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]
  const peopleNormalized = peopleRaw.map((person) => ({
    ...person,
    category: normalizePersonCategory(person.category),
  }))
  let people: (OrgPerson & { displayImage: string | null })[] = []
  try {
    const admin = createSupabaseAdminClient()
    for (const p of peopleNormalized) {
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
	    people = peopleNormalized.map((p) => ({
	      ...p,
	      displayImage: /^https?:/i.test(p.image ?? "") ? (p.image as string) : null,
	    }))
	  }

	  const formationStatusRaw = profile["formationStatus"]
	  const isFormationStatus = (value: unknown): value is FormationStatus =>
	    value === "pre_501c3" || value === "in_progress" || value === "approved"
	  const formationStatus: FormationStatus = isFormationStatus(formationStatusRaw) ? formationStatusRaw : "in_progress"

	  const initialProfile = {
	    name: String(profile["name"] ?? ""),
	    description: String(profile["description"] ?? profile["entity"] ?? ""),
	    tagline: String(profile["tagline"] ?? ""),
	    ein: String(orgRow?.ein ?? profile["ein"] ?? ""),
	    formationStatus,
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

  const allowedTabs: ProfileTab[] = ["company", "programs", "people"]
  const initialTab = allowedTabs.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageTutorialButton tutorial="my-organization" />
      <section>
        <OrgProfileCard
          initial={initialProfile}
          people={people}
          programs={programs ?? []}
          initialTab={initialTab}
          initialProgramId={programIdParam || null}
          canEdit={canEdit}
        />
      </section>
    </div>
  )
}
