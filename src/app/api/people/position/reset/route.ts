/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import { normalizePersonCategory } from "@/lib/people/categories"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"

export async function POST(request: Request) {
  try {
    const { supabase, session } = await requireServerSession("/people")
    const userId = session.user.id
    const { orgId, role } = await resolveActiveOrganization(supabase, userId)
    if (!canEditOrganization(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const body = await request.json().catch(() => ({})) as { category?: string }
    const categoryRaw = body?.category
    const category = normalizePersonCategory(typeof categoryRaw === "string" ? categoryRaw : "")
    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const { data: orgRow, error: orgErr } = await supabase
      .from("organizations")
      .select("profile")
      .eq("user_id", orgId)
      .maybeSingle<{ profile: Record<string, unknown> | null }>()
    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })

    const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
    const arr = Array.isArray(profile.org_people) ? (profile.org_people as any[]) : []
    const next = arr.map((p) =>
      normalizePersonCategory(typeof p?.category === "string" ? p.category : "") === category
        ? { ...p, pos: null, category }
        : p
    )
    const nextProfile = { ...profile, org_people: next }

    const { error: upsertErr } = await supabase
      .from("organizations")
      .upsert({ user_id: orgId, profile: nextProfile }, { onConflict: "user_id" })
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

    revalidatePath("/people")
    revalidatePath("/my-organization")

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
 
