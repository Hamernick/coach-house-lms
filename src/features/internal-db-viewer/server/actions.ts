"use server"

import { notFound } from "next/navigation"

import { requireServerSession } from "@/lib/auth"
import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import {
  resolveInternalDbViewerAllowedEmails,
  resolveInternalDbViewerRowLimit,
  resolveInternalDbViewerSelectedTable,
  resolveInternalDbViewerTables,
} from "../lib"
import type { InternalDbViewerLoadInput, InternalDbViewerSnapshot } from "../types"

function normalizeSearchParam(value: string | string[] | null | undefined): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== "object") return String(error)
  const record = error as Record<string, unknown>
  const code = typeof record.code === "string" ? record.code : null
  const message = typeof record.message === "string" ? record.message : null
  const details = typeof record.details === "string" ? record.details : null
  return [code, message, details].filter(Boolean).join(" — ") || "Unknown error"
}

async function requireInternalDbViewerAccess(redirectPath: string) {
  const { supabase, session } = await requireServerSession(redirectPath)
  const email = session.user.email?.toLowerCase() ?? null
  const allowedEmails = resolveInternalDbViewerAllowedEmails(env.INTERNAL_DB_VIEWER_ALLOWED_EMAILS)

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle<{ role: string | null }>()

  if (error) {
    throw new Error(`Unable to verify DB viewer access: ${formatError(error)}`)
  }

  const isAdmin = profile?.role === "admin"
  const isAllowlisted = email ? allowedEmails.has(email) : false
  if (!isAdmin && !isAllowlisted) {
    notFound()
  }

  return {
    userId: session.user.id,
    email,
    mode: isAdmin ? "admin" : "allowlist",
  } as const
}

export async function loadInternalDbViewerSnapshot(input: InternalDbViewerLoadInput): Promise<InternalDbViewerSnapshot> {
  const access = await requireInternalDbViewerAccess("/db-viewer")
  const allowedTables = resolveInternalDbViewerTables(env.INTERNAL_DB_VIEWER_TABLES)
  const selectedTable = resolveInternalDbViewerSelectedTable({
    allowedTables,
    candidate: normalizeSearchParam(input.tableParam),
  })
  const rowLimit = resolveInternalDbViewerRowLimit(normalizeSearchParam(input.limitParam))

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error, count } = await supabaseAdmin
      .from(selectedTable)
      .select("*", { count: "exact" })
      .limit(rowLimit)

    if (error) {
      return {
        access,
        allowedTables,
        selectedTable,
        rowLimit,
        rowCount: null,
        rows: [],
        error: formatError(error),
      }
    }

    return {
      access,
      allowedTables,
      selectedTable,
      rowLimit,
      rowCount: count ?? null,
      rows: (data ?? []) as Record<string, unknown>[],
      error: null,
    }
  } catch (error) {
    return {
      access,
      allowedTables,
      selectedTable,
      rowLimit,
      rowCount: null,
      rows: [],
      error: formatError(error),
    }
  }
}
