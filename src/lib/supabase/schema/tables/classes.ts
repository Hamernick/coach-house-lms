export type ClassesTable = {
  Row: {
    id: string
    title: string
    slug: string
    description: string | null
    subtitle: string | null
    video_url: string | null
    link1_title: string | null
    link1_url: string | null
    link2_title: string | null
    link2_url: string | null
    link3_title: string | null
    link3_url: string | null
    stripe_product_id: string | null
    stripe_price_id: string | null
    is_published: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    title: string
    slug: string
    description?: string | null
    subtitle?: string | null
    video_url?: string | null
    link1_title?: string | null
    link1_url?: string | null
    link2_title?: string | null
    link2_url?: string | null
    link3_title?: string | null
    link3_url?: string | null
    stripe_product_id?: string | null
    stripe_price_id?: string | null
    is_published?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    title?: string
    slug?: string
    description?: string | null
    subtitle?: string | null
    video_url?: string | null
    link1_title?: string | null
    link1_url?: string | null
    link2_title?: string | null
    link2_url?: string | null
    link3_title?: string | null
    link3_url?: string | null
    stripe_product_id?: string | null
    stripe_price_id?: string | null
    is_published?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
