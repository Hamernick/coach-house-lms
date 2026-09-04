import type { PublicEnums } from "../enums"

export type PublicHandlesTable = {
  Row: {
    handle: string
    owner_type: PublicEnums["public_handle_owner_type"]
    profile_id: string | null
    organization_id: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    handle: string
    owner_type: PublicEnums["public_handle_owner_type"]
    profile_id?: string | null
    organization_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    handle?: string
    owner_type?: PublicEnums["public_handle_owner_type"]
    profile_id?: string | null
    organization_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_handles_profile_id_fkey"
      columns: ["profile_id"]
      isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "public_handles_organization_id_fkey"
      columns: ["organization_id"]
      isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
