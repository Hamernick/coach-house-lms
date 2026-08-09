import type { Json } from "../../types"

export type ProgramsTable = {
  Row: {
    id: string
    user_id: string
    slug: string | null
    title: string
    subtitle: string | null
    description: string | null
    location: string | null
    location_type: string
    location_url: string | null
    image_url: string | null
    duration_label: string | null
    start_date: string | null
    end_date: string | null
    features: string[] | null
    status_label: string | null
    goal_cents: number | null
    raised_cents: number | null
    is_public: boolean
    cta_label: string | null
    cta_url: string | null
    address_street: string | null
    address_city: string | null
    address_state: string | null
    address_postal: string | null
    address_country: string | null
    team_ids: string[]
    wizard_snapshot: Json
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    slug?: string | null
    title: string
    subtitle?: string | null
    description?: string | null
    location?: string | null
    location_type?: string
    location_url?: string | null
    image_url?: string | null
    duration_label?: string | null
    start_date?: string | null
    end_date?: string | null
    features?: string[] | null
    status_label?: string | null
    goal_cents?: number | null
    raised_cents?: number | null
    is_public?: boolean
    cta_label?: string | null
    cta_url?: string | null
    address_street?: string | null
    address_city?: string | null
    address_state?: string | null
    address_postal?: string | null
    address_country?: string | null
    team_ids?: string[]
    wizard_snapshot?: Json
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    slug?: string | null
    title?: string
    subtitle?: string | null
    description?: string | null
    location?: string | null
    location_type?: string
    location_url?: string | null
    image_url?: string | null
    duration_label?: string | null
    start_date?: string | null
    end_date?: string | null
    features?: string[] | null
    status_label?: string | null
    goal_cents?: number | null
    raised_cents?: number | null
    is_public?: boolean
    cta_label?: string | null
    cta_url?: string | null
    address_street?: string | null
    address_city?: string | null
    address_state?: string | null
    address_postal?: string | null
    address_country?: string | null
    team_ids?: string[]
    wizard_snapshot?: Json
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
