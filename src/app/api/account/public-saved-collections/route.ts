import { revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import {
  resolvePublicSavedItems,
  type PublicSavedItemReference,
} from "@/lib/queries/public-profile-saved-collections"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

const collectionItemSchema = z.object({
  kind: z.enum(["organization", "resource"]),
  id: z.string().trim().min(1).max(256),
})

const saveCollectionSchema = z.object({
  collectionId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(60),
  isPublic: z.boolean(),
  items: z.array(collectionItemSchema).min(1).max(24),
})

const deleteCollectionSchema = z.object({
  collectionId: z.string().uuid(),
})

type CollectionRow = {
  id: string
  name: string
  is_public: boolean
  created_at: string
  updated_at: string
}

type CollectionItemRow = {
  collection_id: string
  item_kind: "organization" | "resource"
  item_id: string
  position: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value.flatMap((entry) =>
        typeof entry === "string" && entry.trim() ? [entry.trim()] : []
      )
    )
  ).slice(0, limit)
}

function savedMapItems(metadata: unknown): PublicSavedItemReference[] {
  const preferences =
    isRecord(metadata) && isRecord(metadata.map_preferences)
      ? metadata.map_preferences
      : {}
  const organizations = stringArray(preferences.favorites, 120)
  const resources = stringArray(preferences.collectedResourceIds, 120)
  return [
    ...organizations.map((id, position) => ({
      kind: "organization" as const,
      id,
      position,
    })),
    ...resources.map((id, position) => ({
      kind: "resource" as const,
      id,
      position: organizations.length + position,
    })),
  ]
}

async function authenticated(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { supabase, user: error ? null : user }
}

function rpcRecord(value: unknown) {
  return isRecord(value) ? value : null
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await authenticated(request)
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [collectionResult, availableItems] = await Promise.all([
    supabase
      .from("public_person_saved_collections")
      .select("id, name, is_public, created_at, updated_at")
      .eq("profile_id", user.id)
      .order("updated_at", { ascending: false })
      .returns<CollectionRow[]>(),
    resolvePublicSavedItems(savedMapItems(user.user_metadata ?? {})),
  ])
  if (collectionResult.error) {
    return NextResponse.json(
      { error: "Unable to load public collections." },
      { status: 500 }
    )
  }

  const collections = collectionResult.data ?? []
  const collectionIds = collections.map((collection) => collection.id)
  const itemResult =
    collectionIds.length > 0
      ? await supabase
          .from("public_person_saved_collection_items")
          .select("collection_id, item_kind, item_id, position")
          .in("collection_id", collectionIds)
          .order("position", { ascending: true })
          .returns<CollectionItemRow[]>()
      : { data: [] as CollectionItemRow[], error: null }
  if (itemResult.error) {
    return NextResponse.json(
      { error: "Unable to load collection items." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    availableItems,
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      isPublic: collection.is_public,
      items: (itemResult.data ?? [])
        .filter((item) => item.collection_id === collection.id)
        .map((item) => ({ kind: item.item_kind, id: item.item_id })),
    })),
  })
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await authenticated(request)
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = saveCollectionSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid collection." }, { status: 400 })
  }

  const savedReferences = savedMapItems(user.user_metadata ?? {})
  const allowedKeys = new Set(
    savedReferences.map((item) => `${item.kind}:${item.id}`)
  )
  const requestedKeys = new Set(
    parsed.data.items.map((item) => `${item.kind}:${item.id}`)
  )
  if (
    requestedKeys.size !== parsed.data.items.length ||
    parsed.data.items.some(
      (item) => !allowedKeys.has(`${item.kind}:${item.id}`)
    )
  ) {
    return NextResponse.json(
      { error: "Collections can contain only resources saved in Find." },
      { status: 422 }
    )
  }

  const resolvedItems = await resolvePublicSavedItems(
    parsed.data.items.map((item, position) => ({ ...item, position }))
  )
  if (resolvedItems.length !== parsed.data.items.length) {
    return NextResponse.json(
      { error: "One or more saved resources are no longer public." },
      { status: 422 }
    )
  }

  const { data, error } = await supabase.rpc(
    "save_person_public_saved_collection",
    {
      p_collection_id: parsed.data.collectionId ?? null,
      p_name: parsed.data.name,
      p_is_public: parsed.data.isPublic,
      p_item_kinds: parsed.data.items.map((item) => item.kind),
      p_item_ids: parsed.data.items.map((item) => item.id),
    }
  )
  const result = rpcRecord(data)
  if (error || result?.ok !== true) {
    const message =
      result?.code === "duplicate_name"
        ? "Use a different collection name."
        : result?.code === "collection_limit"
          ? "You can publish up to 12 collections."
          : "Unable to save this collection."
    return NextResponse.json({ error: message }, { status: 422 })
  }

  revalidateTag("public-profiles", "max")
  return NextResponse.json({
    ok: true,
    collectionId: result.collection_id,
  })
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await authenticated(request)
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = deleteCollectionSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid collection." }, { status: 400 })
  }

  const { data, error } = await supabase.rpc(
    "delete_person_public_saved_collection",
    { p_collection_id: parsed.data.collectionId }
  )
  const result = rpcRecord(data)
  if (error || result?.ok !== true) {
    return NextResponse.json(
      { error: "Unable to delete this collection." },
      { status: 404 }
    )
  }

  revalidateTag("public-profiles", "max")
  return NextResponse.json({ ok: true })
}
