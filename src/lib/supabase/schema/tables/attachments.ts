import type { Json } from "../json"
import type { PublicEnums } from "../enums"

export type AttachmentsTable = {
  Row: {
    id: string
    owner_id: string | null
    scope_type: PublicEnums["attachment_scope_type"]
    scope_id: string
    kind: PublicEnums["attachment_kind"]
    storage_path: string
    mime: string | null
    size: number | null
    meta: Json | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    owner_id?: string | null
    scope_type: PublicEnums["attachment_scope_type"]
    scope_id: string
    kind: PublicEnums["attachment_kind"]
    storage_path: string
    mime?: string | null
    size?: number | null
    meta?: Json | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    owner_id?: string | null
    scope_type?: PublicEnums["attachment_scope_type"]
    scope_id?: string
    kind?: PublicEnums["attachment_kind"]
    storage_path?: string
    mime?: string | null
    size?: number | null
    meta?: Json | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

