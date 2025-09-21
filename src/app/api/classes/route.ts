import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"

import { createSupabaseAdminClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { listClasses } from "@/lib/classes"

const createClassSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  published: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  const page = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10)
  const pageSize = Number.parseInt(request.nextUrl.searchParams.get("pageSize") ?? "10", 10)

  const result = await listClasses({ page: Number.isFinite(page) ? page : 1, pageSize: Number.isFinite(pageSize) ? pageSize : 10 })

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createClassSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    published: parsed.data.published,
  }

  const { data, error } = await admin
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
