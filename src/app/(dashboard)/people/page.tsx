import { Suspense } from "react"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { OrgChartSkeleton } from "@/components/people/org-chart-skeleton"
import { PeopleTable } from "@/components/people/people-table"
import { Separator } from "@/components/ui/separator"
import { OrgChartCanvasLite } from "@/components/people/org-chart-canvas-lite"
import { normalizePersonCategory } from "@/lib/people/categories"
import type { OrgPerson } from "./actions"

export const dynamic = "force-dynamic"

export default async function PeoplePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/people")

  const { data: org } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  const profile = (org?.profile ?? {}) as Record<string, unknown>
  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]

  // Ensure the organization owner shows up as the first person in the directory.
  if (org) {
    const ownerIndex = peopleRaw.findIndex((person) => person?.id === user.id)
    const ownerExisting = ownerIndex > -1 ? peopleRaw[ownerIndex] : null

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

    const ownerPerson: OrgPerson = {
      id: user.id,
      name: derivedName ?? ownerExisting?.name ?? user.email ?? "You",
      title: profileRow?.headline ?? ownerExisting?.title ?? null,
      email: user.email ?? ownerExisting?.email ?? null,
      linkedin: ownerExisting?.linkedin ?? null,
      category: ownerExisting?.category ?? "staff",
      image: profileRow?.avatar_url ?? ownerExisting?.image ?? null,
      reportsToId: ownerExisting?.reportsToId ?? null,
      pos: ownerExisting?.pos ?? null,
    }

    const withoutOwner = ownerIndex > -1 ? peopleRaw.filter((person) => person.id !== user.id) : peopleRaw
    const nextPeople = [ownerPerson, ...withoutOwner]

    const needsSync =
      ownerIndex !== 0 ||
      !ownerExisting ||
      ownerExisting.name !== ownerPerson.name ||
      (ownerExisting.title ?? null) !== (ownerPerson.title ?? null) ||
      (ownerExisting.email ?? null) !== (ownerPerson.email ?? null) ||
      (ownerExisting.image ?? null) !== (ownerPerson.image ?? null)

    if (needsSync) {
      const nextProfile = { ...profile, org_people: nextPeople }
      await supabase
        .from("organizations")
        .upsert({ user_id: user.id, profile: nextProfile }, { onConflict: "user_id" })
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
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageTutorialButton tutorial="people" />
      <section>
        <Suspense fallback={<OrgChartSkeleton />}>
          <OrgChartCanvasLite people={people} />
        </Suspense>
      </section>

      <section>
        <h2 className="text-lg font-semibold">People</h2>
        <Separator className="my-3" />
        <PeopleTable people={people} />
      </section>
    </div>
  )
}
