import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { normalizePersonCategory } from "@/lib/people/categories"
import { mutateOrganizationPeopleProfile } from "@/lib/people/profile-write"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export async function POST(request: Request) {
  try {
    const { supabase, session } = await requireServerSession("/people")
    const userId = session.user.id
    const { orgId, role } = await resolveActiveOrganization(supabase, userId)
    if (!canEditOrganization(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const body = (await request.json().catch(() => ({}))) as {
      category?: string
    }
    const hasCategory =
      typeof body?.category === "string" && body.category.trim().length > 0
    const category = hasCategory ? normalizePersonCategory(body.category) : null

    const writeResult = await mutateOrganizationPeopleProfile<
      Record<string, unknown>,
      null
    >({
      supabase,
      orgId,
      mutate: (people) => {
        let changed = false
        const nextPeople = people.map((person) => {
          if (!isRecord(person)) return person
          const matchesCategory =
            !hasCategory ||
            normalizePersonCategory(
              typeof person.category === "string" ? person.category : ""
            ) === category
          if (!matchesCategory) return person
          if (
            person.pos !== null ||
            (hasCategory && person.category !== category)
          ) {
            changed = true
          }
          return hasCategory
            ? { ...person, pos: null, category }
            : { ...person, pos: null }
        })
        return changed
          ? {
              ok: true,
              changed: true,
              people: nextPeople,
              value: null,
            }
          : { ok: true, changed: false, value: null }
      },
    })
    if ("error" in writeResult) {
      return NextResponse.json({ error: writeResult.error }, { status: 500 })
    }

    revalidatePath("/people")
    revalidatePath("/organization")

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
