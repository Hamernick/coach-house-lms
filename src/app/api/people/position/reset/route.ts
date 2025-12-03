/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { supabase, session } = await requireServerSession("/people")
    const userId = session.user.id
    const body = await request.json().catch(() => ({})) as { category?: "staff" | "board" | "supporter" }
    const category = body?.category
    if (!category || !["staff", "board", "supporter"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const { data: orgRow, error: orgErr } = await supabase
      .from("organizations")
      .select("profile")
      .eq("user_id", userId)
      .maybeSingle<{ profile: Record<string, unknown> | null }>()
    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })

    const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
    const arr = Array.isArray(profile.org_people) ? (profile.org_people as any[]) : []
    const next = arr.map((p) => (p?.category === category ? { ...p, pos: null } : p))
    const nextProfile = { ...profile, org_people: next }

    const { error: upsertErr } = await supabase
      .from("organizations")
      .upsert({ user_id: userId, profile: nextProfile }, { onConflict: "user_id" })
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

    revalidatePath("/people")
    revalidatePath("/my-organization")

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
 
