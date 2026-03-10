import type { PublicTables } from "@/lib/supabase/schema/tables"

export type InternalDbViewerTableName = keyof PublicTables

export type InternalDbViewerRow = Record<string, unknown>

export type InternalDbViewerAccessMode = "admin" | "allowlist"

export type InternalDbViewerAccess = {
  userId: string
  email: string | null
  mode: InternalDbViewerAccessMode
}

export type InternalDbViewerLoadInput = {
  tableParam?: string | string[] | null
  limitParam?: string | string[] | null
}

export type InternalDbViewerSnapshot = {
  access: InternalDbViewerAccess
  allowedTables: InternalDbViewerTableName[]
  selectedTable: InternalDbViewerTableName
  rowLimit: number
  rowCount: number | null
  rows: InternalDbViewerRow[]
  error: string | null
}
