import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { isAbsolute, resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import { shouldShowPublicMapResourceItem } from "@/lib/public-map/resource-item-visibility"
import { buildExternalResourceMapItemFromLocalPreviewRecord } from "@/lib/public-map/resource-map-local-preview-adapter"
import { buildExternalResourceMapItemFromPublicRow } from "@/lib/public-map/resource-map-public-item-adapter"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { Database } from "@/lib/supabase/types"

export type FetchPublicResourceMapItemsOptions = {
  enabled?: boolean
  localEnginePreviewFile?: string | null
  localPreviewFile?: string | null
  limit?: number
}

export const DEFAULT_RESOURCE_MAP_LOCAL_ENGINE_PREVIEW_FILE =
  "data/resource-map/.engine/candidate-records.jsonl"
export const DEFAULT_RESOURCE_MAP_LOCAL_PREVIEW_LIMIT = 5000
export const DEFAULT_RESOURCE_MAP_PUBLIC_DB_LIMIT = 500

export function isResourceMapPublicDbEnabled(
  value = env.RESOURCE_MAP_PUBLIC_DB_ENABLED
) {
  return value?.trim().toLowerCase() === "true"
}

function normalizeLocalPreviewFile(value: string | null | undefined) {
  const filePath = value?.trim()
  if (!filePath) return null
  return isAbsolute(filePath)
    ? filePath
    : resolve(/*turbopackIgnore: true*/ process.cwd(), filePath)
}

function parseLocalPreviewRows(raw: string): unknown[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.resources)
      ) {
        return parsed.resources
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.records)
      ) {
        return parsed.records
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return parsed.items
      }
      return [parsed]
    } catch (error) {
      if (!trimmed.includes("\n")) {
        throw new Error(
          `Invalid resource-map local preview JSON: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(
          `Invalid resource-map local preview JSONL at line ${index + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    })
}

async function fetchLocalResourceMapPreviewItems({
  filePath,
  limit = DEFAULT_RESOURCE_MAP_LOCAL_PREVIEW_LIMIT,
}: {
  filePath: string
  limit?: number
}) {
  const raw = await readFile(filePath, "utf8")
  return parseLocalPreviewRows(raw)
    .map((row, index) =>
      row && typeof row === "object"
        ? buildExternalResourceMapItemFromLocalPreviewRecord(
            row as Record<string, unknown>,
            index
          )
        : null
    )
    .filter((item): item is ExternalResourceMapItem => item !== null)
    .filter(shouldShowPublicMapResourceItem)
    .slice(0, limit)
}

async function fetchPublicResourceMapItemsUncached({
  limit = DEFAULT_RESOURCE_MAP_PUBLIC_DB_LIMIT,
}: {
  limit?: number
}): Promise<ExternalResourceMapItem[]> {
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  const { data, error } = await supabase.rpc("get_resource_map_public_items", {
    p_category_keys: null,
    p_latitude: null,
    p_limit: limit,
    p_longitude: null,
    p_query: null,
    p_radius_miles: null,
  })

  if (error || !data) {
    console.warn("[resource-map] public RPC unavailable; using seed fallback", {
      code: error?.code,
      message: error?.message,
    })
    return []
  }

  return data
    .map(buildExternalResourceMapItemFromPublicRow)
    .filter((item): item is ExternalResourceMapItem => item !== null)
    .filter(shouldShowPublicMapResourceItem)
}

export async function fetchPublicResourceMapItems(
  options: FetchPublicResourceMapItemsOptions = {}
): Promise<ExternalResourceMapItem[]> {
  const localPreviewFile = normalizeLocalPreviewFile(
    options.localPreviewFile ?? env.RESOURCE_MAP_LOCAL_PREVIEW_FILE
  )
  if (localPreviewFile) {
    try {
      return await fetchLocalResourceMapPreviewItems({
        filePath: localPreviewFile,
        limit: options.limit,
      })
    } catch (error) {
      console.warn("[resource-map] local preview file unavailable", {
        filePath: localPreviewFile,
        message: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  const localEnginePreviewFile =
    options.localEnginePreviewFile === null
      ? null
      : normalizeLocalPreviewFile(
          options.localEnginePreviewFile ??
            DEFAULT_RESOURCE_MAP_LOCAL_ENGINE_PREVIEW_FILE
        )
  if (localEnginePreviewFile && existsSync(localEnginePreviewFile)) {
    try {
      const items = await fetchLocalResourceMapPreviewItems({
        filePath: localEnginePreviewFile,
        limit: options.limit,
      })
      if (items.length > 0) return items
    } catch (error) {
      console.warn("[resource-map] local engine preview file unavailable", {
        filePath: localEnginePreviewFile,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const enabled = options.enabled ?? isResourceMapPublicDbEnabled()
  if (!enabled) return []

  return fetchPublicResourceMapItemsUncached({
    limit: options.limit,
  })
}
