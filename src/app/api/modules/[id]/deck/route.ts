import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createModuleDeckSignedUrl } from "@/lib/storage/decks"
import type { Database } from "@/lib/supabase"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: moduleId } = await context.params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("deck_path")
    .eq("id", moduleId)
    .maybeSingle<Pick<Database["public"]["Tables"]["modules"]["Row"], "deck_path">>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || !data.deck_path) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 })
  }

  const signedUrl = await createModuleDeckSignedUrl(data.deck_path)

  return NextResponse.redirect(signedUrl)
}
