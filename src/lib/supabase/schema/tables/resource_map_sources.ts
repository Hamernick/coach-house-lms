import type { Json } from "../json"

export type ResourceMapSourcesTable = {
  Row: {
    id: string
    name: string
    slug: string
    homepage_url: string | null
    source_type: string
    license_label: string | null
    license_url: string | null
    attribution: string | null
    refresh_cadence: string | null
    trust_level: string
    metadata: Json
    created_by: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    name: string
    slug: string
    homepage_url?: string | null
    source_type?: string
    license_label?: string | null
    license_url?: string | null
    attribution?: string | null
    refresh_cadence?: string | null
    trust_level?: string
    metadata?: Json
    created_by?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    name?: string
    slug?: string
    homepage_url?: string | null
    source_type?: string
    license_label?: string | null
    license_url?: string | null
    attribution?: string | null
    refresh_cadence?: string | null
    trust_level?: string
    metadata?: Json
    created_by?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_sources_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_sources_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
