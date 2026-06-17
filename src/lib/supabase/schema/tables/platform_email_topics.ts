export type PlatformEmailTopicsTable = {
  Row: {
    id: string
    label: string
    description: string
    required: boolean
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    label: string
    description?: string
    required?: boolean
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    label?: string
    description?: string
    required?: boolean
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
