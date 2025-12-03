export type ModulesTable = {
  Row: {
    id: string
    class_id: string
    idx: number
    slug: string
    title: string
    description: string | null
    video_url: string | null
    content_md: string | null
    duration_minutes: number | null
    deck_path: string | null
    is_published: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    class_id: string
    idx: number
    slug: string
    title: string
    description?: string | null
    video_url?: string | null
    content_md?: string | null
    duration_minutes?: number | null
    deck_path?: string | null
    is_published?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    class_id?: string
    idx?: number
    slug?: string
    title?: string
    description?: string | null
    video_url?: string | null
    content_md?: string | null
    duration_minutes?: number | null
    deck_path?: string | null
    is_published?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "modules_class_id_fkey"
      columns: ["class_id"]
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },
  ]
}

