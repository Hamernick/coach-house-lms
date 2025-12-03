import type { PublicEnums } from "../enums"

export type ProfilesTable = {
  Row: {
    id: string
    full_name: string | null
    avatar_url: string | null
    headline: string | null
    timezone: string | null
    email: string | null
    role: PublicEnums["user_role"]
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
    headline?: string | null
    timezone?: string | null
    email?: string | null
    role?: PublicEnums["user_role"]
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
    headline?: string | null
    timezone?: string | null
    email?: string | null
    role?: PublicEnums["user_role"]
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "profiles_id_fkey"
      columns: ["id"]
      isOneToOne: true
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
  ]
}

