export type CoachingCoachesTable = {
  Row: {
    id: string
    display_name: string
    title: string
    focus: string
    avatar_url: string | null
    active: boolean
    sort_order: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    display_name: string
    title: string
    focus: string
    avatar_url?: string | null
    active?: boolean
    sort_order?: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    display_name?: string
    title?: string
    focus?: string
    avatar_url?: string | null
    active?: boolean
    sort_order?: number
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
