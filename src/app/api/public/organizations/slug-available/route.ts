import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 60).replace(/^-+|-+$/g, "")
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)

  const { searchParams } = new URL(request.url)
  const raw = (searchParams.get("slug") || "").trim()
  if (!raw) return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  const normalized = slugify(raw)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return NextResponse.json({ available: false, slug: normalized, error: "Invalid format" }, { status: 200 })
  }

  const reserved = new Set([
    'admin','api','login','signup','pricing','billing','class','dashboard','people','my-organization','_next','public','favicon','assets'
  ])
  if (reserved.has(normalized)) {
    return NextResponse.json({ available: false, slug: normalized, error: "Reserved URL" }, { status: 200 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from("organizations")
    .select("user_id", { count: "exact", head: true })
    .ilike("public_slug", normalized)

  if (user?.id) {
    query = query.neq("user_id", user.id)
  }

  const { count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const available = (count ?? 0) === 0
  return NextResponse.json({ slug: normalized, available }, { status: 200 })
}
