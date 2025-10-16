import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import { OrgChartCanvas } from "@/components/people/org-chart-canvas"
import { PeopleShowcase } from "@/components/people/supporters-showcase"
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

  // Resolve signed URLs for storage-backed avatars
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
    // Fallback: no admin key or signing failed; still render with initials
    people = peopleRaw.map((p) => ({ ...p, displayImage: /^https?:/i.test(p.image ?? "") ? (p.image as string) : null }))
  }

  const staff = people.filter((p) => p.category === "staff")
  const board = people.filter((p) => p.category === "board")
  const supporters = people.filter((p) => p.category === "supporter")

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <section className="flex items-center justify-end">
        <CreatePersonDialog people={peopleRaw} />
      </section>

      <section>
        <Card className="bg-card/60">
          <CardContent className="p-0">
            <OrgChartCanvas people={people} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Staff</h2>
        <Separator className="my-3" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {staff.map((p) => (
            <PersonItem key={p.id} person={p} allPeople={people} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Board</h2>
        <Separator className="my-3" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {board.map((p) => (
            <PersonItem key={p.id} person={p} allPeople={people} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Supporters</h2>
        <Separator className="my-3" />
        <PeopleShowcase people={supporters} allPeople={people} emptyMessage="No supporters yet. Add supporters below." />
      </section>
    </div>
  )
}
