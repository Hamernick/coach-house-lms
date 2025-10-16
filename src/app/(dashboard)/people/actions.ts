"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export type OrgPerson = {
  id: string
  name: string
  title?: string | null
  email?: string | null
  linkedin?: string | null
  category: "staff" | "board" | "supporter"
  image?: string | null
  reportsToId?: string | null
  pos?: { x: number; y: number } | null
}

function normalizeCategory(input: string): OrgPerson["category"] {
  const v = (input || "").toLowerCase()
  if (v.startsWith("board")) return "board"
  if (v.startsWith("support")) return "supporter"
  return "staff"
}

async function fetchLinkedInImage(url: string): Promise<string | null> {
  try {
    const u = url.startsWith("http") ? url : `https://www.linkedin.com/in/${url.replace(/^\//, "")}`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(u, {
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const html = await res.text()
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    if (og && og[1]) return og[1]
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    if (tw && tw[1]) return tw[1]
    return null
  } catch {
    return null
  }
}

export async function upsertPersonAction(person: Omit<OrgPerson, "id"> & { id?: string }) {
  const { supabase, session } = await requireServerSession("/people")
  const userId = session.user.id

  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (orgErr) return { error: orgErr.message }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const arr = Array.isArray(profile.org_people) ? (profile.org_people as OrgPerson[]) : []

  const id = person.id && person.id.length > 0 ? person.id : globalThis.crypto?.randomUUID?.() || `${Date.now()}`
  let image = person.image?.trim() || null
  if (!image && person.linkedin) {
    const scraped = await fetchLinkedInImage(person.linkedin)
    if (scraped) image = scraped
  }

  // If we have an external image URL, mirror it into storage for reliability
  if (image && /^https?:/i.test(image)) {
    try {
      const admin = createSupabaseAdminClient()
      const bucket = "avatars"
      // Ensure bucket exists (private)
      const { data: existing } = await admin.storage.getBucket(bucket)
      if (!existing) {
        await admin.storage.createBucket(bucket, { public: false })
      }
      const res = await fetch(image, { cache: "no-store" })
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer()
        const contentType = res.headers.get("content-type") || "image/jpeg"
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
        const id = person.id && person.id.length > 0 ? person.id : globalThis.crypto?.randomUUID?.() || `${Date.now()}`
        const objectPath = `users/${userId}/${id}.${ext}`
        await admin.storage.from(bucket).upload(objectPath, arrayBuf, {
          contentType,
          upsert: true,
        })
        // Store storage path relative to bucket
        image = objectPath
      }
    } catch {}
  }

  const nextItem: OrgPerson = {
    id,
    name: person.name?.trim() || "Untitled",
    title: person.title?.trim() || null,
    email: person.email?.trim() || null,
    linkedin: person.linkedin?.trim() || null,
    category: normalizeCategory(person.category),
    image,
    reportsToId: person.reportsToId ?? null,
    pos: null,
  }

  const existingIdx = arr.findIndex((p) => p.id === id)
  if (existingIdx >= 0) {
    const prev = arr[existingIdx]
    if (prev?.pos && !nextItem.pos) nextItem.pos = prev.pos
    arr[existingIdx] = nextItem
  }
  else arr.push(nextItem)

  const nextProfile = { ...profile, org_people: arr }
  const { error: upsertErr } = await supabase
    .from("organizations")
    .upsert({ user_id: userId, profile: nextProfile }, { onConflict: "user_id" })
  if (upsertErr) return { error: upsertErr.message }

  revalidatePath("/people")
  return { ok: true, id }
}

export async function deletePersonAction(id: string) {
  const { supabase, session } = await requireServerSession("/people")
  const userId = session.user.id
  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (orgErr) return { error: orgErr.message }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const arr = Array.isArray(profile.org_people) ? (profile.org_people as OrgPerson[]) : []
  const next = arr.filter((p) => p.id !== id)
  const nextProfile = { ...profile, org_people: next }
  const { error: upsertErr } = await supabase
    .from("organizations")
    .upsert({ user_id: userId, profile: nextProfile }, { onConflict: "user_id" })
  if (upsertErr) return { error: upsertErr.message }
  revalidatePath("/people")
  return { ok: true }
}

export async function refreshPersonLinkedInImageAction(id: string) {
  const { supabase, session } = await requireServerSession("/people")
  const userId = session.user.id

  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (orgErr) return { error: orgErr.message }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const arr = Array.isArray(profile.org_people) ? (profile.org_people as OrgPerson[]) : []
  const person = arr.find((p) => p.id === id)
  if (!person) return { error: "Not found" }
  if (!person.linkedin) return { error: "LinkedIn not set" }

  const imageUrl = await fetchLinkedInImage(person.linkedin)
  if (!imageUrl) return { error: "Could not fetch image" }

  // Upload to storage
  try {
    const admin = createSupabaseAdminClient()
    const bucket = "avatars"
    const { data: existing } = await admin.storage.getBucket(bucket)
    if (!existing) await admin.storage.createBucket(bucket, { public: false })
    const res = await fetch(imageUrl, { cache: "no-store" })
    if (!res.ok) return { error: "Fetch failed" }
    const arrayBuf = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
    const objectPath = `users/${userId}/${id}.${ext}`
    await admin.storage.from(bucket).upload(objectPath, arrayBuf, { contentType, upsert: true })
    person.image = objectPath
    const next = arr.map((p) => (p.id === id ? person : p))
    const nextProfile = { ...profile, org_people: next }
    const { error: upsertErr } = await supabase
      .from("organizations")
      .upsert({ user_id: userId, profile: nextProfile }, { onConflict: "user_id" })
    if (upsertErr) return { error: upsertErr.message }
    revalidatePath("/people")
    return { ok: true }
  } catch (e) {
    return { error: "Upload failed" }
  }
}
