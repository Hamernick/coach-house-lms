import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/lib/supabase"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

type OrgPolicyStatus = "not_started" | "in_progress" | "complete"
const BUCKET = "org-documents"

type OrgPolicyDocument = {
  name: string
  path: string
  size: number
  mime: string
  updatedAt: string
}

type OrgPolicy = {
  id: string
  title: string
  summary: string
  status: OrgPolicyStatus
  categories: string[]
  programId: string | null
  personIds: string[]
  document: OrgPolicyDocument | null
  updatedAt: string
}

const ALLOWED_STATUSES = new Set<OrgPolicyStatus>([
  "not_started",
  "in_progress",
  "complete",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeCategories(input: unknown): string[] {
  const values = Array.isArray(input) ? input : []
  const seen = new Set<string>()
  const output: string[] = []
  for (const entry of values) {
    if (typeof entry !== "string") continue
    const value = entry.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

function normalizeDocument(value: unknown): OrgPolicyDocument | null {
  if (!isRecord(value)) return null
  if (typeof value["path"] !== "string" || value["path"].trim().length === 0) return null
  return {
    name: typeof value["name"] === "string" ? value["name"] : "",
    path: value["path"],
    size: typeof value["size"] === "number" ? value["size"] : 0,
    mime: typeof value["mime"] === "string" ? value["mime"] : "application/pdf",
    updatedAt:
      typeof value["updatedAt"] === "string" ? value["updatedAt"] : new Date().toISOString(),
  }
}

function normalizePolicy(entry: unknown): OrgPolicy | null {
  if (!isRecord(entry)) return null
  const id = typeof entry["id"] === "string" ? entry["id"].trim() : ""
  const title = typeof entry["title"] === "string" ? entry["title"].trim() : ""
  if (!id || !title) return null
  const statusRaw = typeof entry["status"] === "string" ? entry["status"] : "not_started"
  const status = ALLOWED_STATUSES.has(statusRaw as OrgPolicyStatus)
    ? (statusRaw as OrgPolicyStatus)
    : "not_started"
  const personIdsRaw = Array.isArray(entry["personIds"]) ? (entry["personIds"] as unknown[]) : []
  const updatedAtRaw = typeof entry["updatedAt"] === "string" ? entry["updatedAt"] : new Date().toISOString()
  const categories = normalizeCategories(entry["categories"])
  const legacyBoard = Boolean(entry["board"])
  return {
    id,
    title,
    summary: typeof entry["summary"] === "string" ? entry["summary"].trim() : "",
    status,
    categories: categories.length > 0 ? categories : legacyBoard ? ["Board"] : [],
    programId: typeof entry["programId"] === "string" && entry["programId"].trim().length > 0 ? entry["programId"].trim() : null,
    personIds: Array.from(new Set(personIdsRaw.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim()))),
    document: normalizeDocument(entry["document"]),
    updatedAt: updatedAtRaw,
  }
}

async function loadProfile(
  supabase: ReturnType<typeof createSupabaseRouteHandlerClient>,
  orgId: string,
) {
  const { data: orgRow, error } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (error) throw new Error(error.message)
  return (orgRow?.profile ?? {}) as Record<string, unknown>
}

function readPolicies(profile: Record<string, unknown>): OrgPolicy[] {
  const raw = Array.isArray(profile["policies"]) ? (profile["policies"] as unknown[]) : []
  return raw.map((entry) => normalizePolicy(entry)).filter((entry): entry is OrgPolicy => Boolean(entry))
}

async function savePolicies(
  supabase: ReturnType<typeof createSupabaseRouteHandlerClient>,
  orgId: string,
  profile: Record<string, unknown>,
  policies: OrgPolicy[],
) {
  const nextProfile = { ...profile, policies }
  const { error } = await supabase
    .from("organizations")
    .upsert(
      {
        user_id: orgId,
        profile: nextProfile as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
      },
      { onConflict: "user_id" },
    )
  if (error) throw new Error(error.message)
}

async function requireOrgEditor(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 }) }
  }
  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { supabase, orgId }
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId } = await resolveActiveOrganization(supabase, user.id)
    const profile = await loadProfile(supabase, orgId)
    return NextResponse.json({ policies: readPolicies(profile) }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to load policies" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireOrgEditor(request)
  if ("error" in auth) return auth.error

  const payload = await request.json().catch(() => null)
  const title = typeof payload?.title === "string" ? payload.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "Policy title is required." }, { status: 400 })
  }

  const statusRaw = typeof payload?.status === "string" ? payload.status : "not_started"
  const status = ALLOWED_STATUSES.has(statusRaw as OrgPolicyStatus)
    ? (statusRaw as OrgPolicyStatus)
    : "not_started"
  const categories = normalizeCategories(payload?.categories)
  if (categories.length === 0 && Boolean(payload?.board)) {
    categories.push("Board")
  }
  const now = new Date().toISOString()
  const nextPolicy: OrgPolicy = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    title,
    summary: typeof payload?.summary === "string" ? payload.summary.trim() : "",
    status,
    categories,
    programId:
      typeof payload?.programId === "string" && payload.programId.trim().length > 0
        ? payload.programId.trim()
        : null,
    personIds: Array.isArray(payload?.personIds)
      ? Array.from(
          new Set(
            (payload.personIds as unknown[])
              .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
              .map((value) => value.trim()),
          ),
        )
      : [],
    document: null,
    updatedAt: now,
  }

  try {
    const profile = await loadProfile(auth.supabase, auth.orgId)
    const policies = readPolicies(profile)
    const nextPolicies = [nextPolicy, ...policies]
    await savePolicies(auth.supabase, auth.orgId, profile, nextPolicies)
    return NextResponse.json({ policy: nextPolicy, policies: nextPolicies }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to create policy" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOrgEditor(request)
  if ("error" in auth) return auth.error

  const payload = await request.json().catch(() => null)
  const id = typeof payload?.id === "string" ? payload.id.trim() : ""
  if (!id) return NextResponse.json({ error: "Policy id is required." }, { status: 400 })

  const title = typeof payload?.title === "string" ? payload.title.trim() : ""
  if (!title) return NextResponse.json({ error: "Policy title is required." }, { status: 400 })

  const statusRaw = typeof payload?.status === "string" ? payload.status : "not_started"
  const status = ALLOWED_STATUSES.has(statusRaw as OrgPolicyStatus)
    ? (statusRaw as OrgPolicyStatus)
    : "not_started"
  const categories = normalizeCategories(payload?.categories)
  if (categories.length === 0 && Boolean(payload?.board)) {
    categories.push("Board")
  }

  try {
    const profile = await loadProfile(auth.supabase, auth.orgId)
    const policies = readPolicies(profile)
    const existing = policies.find((entry) => entry.id === id)
    if (!existing) return NextResponse.json({ error: "Policy not found." }, { status: 404 })

    const nextPolicy: OrgPolicy = {
      ...existing,
      title,
      summary: typeof payload?.summary === "string" ? payload.summary.trim() : "",
      status,
      categories,
      programId:
        typeof payload?.programId === "string" && payload.programId.trim().length > 0
          ? payload.programId.trim()
          : null,
      personIds: Array.isArray(payload?.personIds)
        ? Array.from(
            new Set(
              (payload.personIds as unknown[])
                .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                .map((value) => value.trim()),
            ),
          )
        : [],
      updatedAt: new Date().toISOString(),
    }

    const nextPolicies = policies.map((entry) => (entry.id === id ? nextPolicy : entry))
    await savePolicies(auth.supabase, auth.orgId, profile, nextPolicies)
    return NextResponse.json({ policy: nextPolicy, policies: nextPolicies }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to update policy" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireOrgEditor(request)
  if ("error" in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")?.trim() ?? ""
  if (!id) return NextResponse.json({ error: "Policy id is required." }, { status: 400 })

  try {
    const profile = await loadProfile(auth.supabase, auth.orgId)
    const policies = readPolicies(profile)
    const policyToDelete = policies.find((entry) => entry.id === id)
    if (policyToDelete?.document?.path) {
      await auth.supabase.storage.from(BUCKET).remove([policyToDelete.document.path])
    }
    const nextPolicies = policies.filter((entry) => entry.id !== id)
    await savePolicies(auth.supabase, auth.orgId, profile, nextPolicies)
    return NextResponse.json({ ok: true, policies: nextPolicies }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to delete policy" },
      { status: 500 },
    )
  }
}
