/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseAdminClient } from "@/lib/supabase"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  published: z.boolean().optional(),
})

export async function GET(_request: Request, context: any) {
  const { params } = context as { params: { id: string } }
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("classes")
    .select("*, modules ( id, title, idx, slug, published )")
    .eq("id", params.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request, context: any) {
  const { params } = context as { params: { id: string } }
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("classes")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, context: any) {
  const { params } = context as { params: { id: string } }
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from("classes").delete().eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
