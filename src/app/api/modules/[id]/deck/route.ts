import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createModuleDeckSignedUrl } from "@/lib/storage/decks"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: moduleId } = await context.params
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("modules")
    .select("deck_path")
    .eq("id", moduleId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const record = data as { deck_path: string | null } | null

  if (!record || !record.deck_path) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 })
  }

  const signedUrl = await createModuleDeckSignedUrl(record.deck_path)

  return NextResponse.redirect(signedUrl)
}
