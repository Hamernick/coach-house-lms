export type ClassesTable = {
  Row: {
    id: string
    title: string
    slug: string
    description: string | null
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
    stripe_product_id?: string | null
    stripe_price_id?: string | null
    is_published?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

