import type { Json } from "../json"

export type ModuleContentTable = {
  Row: {
    module_id: string
    video_url: string | null
    resources: Json | null
    homework: Json | null
    created_at?: string | null
    updated_at?: string | null
  }
  Insert: {
    module_id: string
    video_url?: string | null
    resources?: Json | null
    homework?: Json | null
    created_at?: string | null
    updated_at?: string | null
  }
  Update: {
    module_id?: string
    video_url?: string | null
    resources?: Json | null
    homework?: Json | null
    created_at?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "module_content_module_id_fkey"
      columns: ["module_id"]
      referencedRelation: "modules"
      referencedColumns: ["id"]
    },
  ]
}

