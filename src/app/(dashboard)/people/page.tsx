import { Suspense } from "react"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { OrgChartSkeleton } from "@/components/people/org-chart-skeleton"
import { PeopleTableShell } from "@/components/people/people-table"
import { Separator } from "@/components/ui/separator"
import { OrgChartCanvasLite } from "@/components/people/org-chart-canvas-lite"
import { ClientOnly } from "@/components/client-only"
import { normalizePersonCategory } from "@/lib/people/categories"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import type { OrgPerson } from "@/actions/people"

export const dynamic = "force-dynamic"

export default async function PeoplePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/people")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)

  const { data: org } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  const profile = (org?.profile ?? {}) as Record<string, unknown>
  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]

  // Keep the signed-in user present + synced inside the active org directory.
  if (org) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name, headline, avatar_url")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null; headline: string | null; avatar_url: string | null }>()

    const derivedName =
      typeof profileRow?.full_name === "string" && profileRow.full_name.trim().length > 0
        ? profileRow.full_name.trim()
        : typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
          ? user.user_metadata.full_name.trim()
          : null

    const membershipCategory = role === "board" ? "governing_board" : "staff"
    const selfIndex = peopleRaw.findIndex((person) => person?.id === user.id)
    const selfExisting = selfIndex > -1 ? peopleRaw[selfIndex] : null

    const nextSelf: OrgPerson = {
      id: user.id,
      name: derivedName ?? selfExisting?.name ?? user.email ?? "You",
      title: profileRow?.headline ?? selfExisting?.title ?? null,
      email: user.email ?? selfExisting?.email ?? null,
      linkedin: selfExisting?.linkedin ?? null,
      category: selfExisting?.category ?? membershipCategory,
      image: profileRow?.avatar_url ?? selfExisting?.image ?? null,
      reportsToId: selfExisting?.reportsToId ?? null,
      pos: selfExisting?.pos ?? null,
    }

    const nextPeople = [...peopleRaw]
    if (selfIndex > -1) nextPeople[selfIndex] = nextSelf
    else nextPeople.push(nextSelf)

    // Ensure the org owner is first (orgId is the owner id).
    const ownerIndex = nextPeople.findIndex((person) => person?.id === orgId)
    if (ownerIndex > 0) {
      const [owner] = nextPeople.splice(ownerIndex, 1)
      nextPeople.unshift(owner)
    }

    const needsSync =
      selfIndex === -1 ||
      (selfExisting?.name ?? null) !== (nextSelf.name ?? null) ||
      (selfExisting?.title ?? null) !== (nextSelf.title ?? null) ||
      (selfExisting?.email ?? null) !== (nextSelf.email ?? null) ||
      (selfExisting?.image ?? null) !== (nextSelf.image ?? null) ||
      (selfExisting?.category ?? null) !== (nextSelf.category ?? null) ||
      (ownerIndex > 0)

    if (needsSync) {
      const nextProfile = { ...profile, org_people: nextPeople }
      if (canEdit) {
        await supabase
          .from("organizations")
          .upsert({ user_id: orgId, profile: nextProfile }, { onConflict: "user_id" })
      }
      peopleRaw.splice(0, peopleRaw.length, ...nextPeople)
    }
  }
  const normalizedPeople = peopleRaw.map((person) => ({
    ...person,
    category: normalizePersonCategory(person.category),
  }))

  // Resolve signed URLs for storage-backed avatars (parallelized)
  let people: (OrgPerson & { displayImage: string | null })[] = []
  try {
    const admin = createSupabaseAdminClient()
    people = await Promise.all(
      normalizedPeople.map(async (p) => {
        let displayImage: string | null = null
        if (p.image) {
          if (/^https?:/i.test(p.image) || p.image.startsWith("data:")) {
            displayImage = p.image
          } else {
            const { data: signed } = await admin.storage.from("avatars").createSignedUrl(p.image, 60 * 60)
            displayImage = signed?.signedUrl ?? null
          }
        }
        return { ...p, displayImage }
      })
    )
  } catch {
    // Fallback: no admin key or signing failed; still render with initials
    people = normalizedPeople.map((p) => ({ ...p, displayImage: /^https?:/i.test(p.image ?? "") ? (p.image as string) : null }))
  }

  // Flat list drives both canvas and table; table filters internally

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageTutorialButton tutorial="people" />
      <section>
        <Suspense fallback={<OrgChartSkeleton />}>
          <OrgChartCanvasLite people={people} canEdit={canEdit} />
        </Suspense>
      </section>

      <section>
        <h2 className="text-lg font-semibold">People</h2>
        <Separator className="my-3" />
        <ClientOnly
          fallback={
            <div className="rounded-md border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
              Loading people…
            </div>
          }
        >
          <PeopleTableShell people={people} canEdit={canEdit} />
        </ClientOnly>
      </section>
    </div>
  )
}
