import type { Json } from "../json"
import type { PublicEnums } from "../enums"

export type OrganizationsTable = {
  Row: {
    user_id: string
    ein: string | null
    status: PublicEnums["organization_status"]
    profile: Json
    created_at: string
    updated_at: string
    location_lat: number | null
    location_lng: number | null
    public_slug: string | null
    is_public: boolean | null
    is_public_roadmap: boolean | null
  }
  Insert: {
    user_id: string
    ein?: string | null
    status?: PublicEnums["organization_status"]
    profile?: Json
    created_at?: string
    updated_at?: string
    location_lat?: number | null
    location_lng?: number | null
    public_slug?: string | null
    is_public?: boolean | null
    is_public_roadmap?: boolean | null
  }
  Update: {
    user_id?: string
    ein?: string | null
    status?: PublicEnums["organization_status"]
    profile?: Json
    created_at?: string
    updated_at?: string
    location_lat?: number | null
    location_lng?: number | null
    public_slug?: string | null
    is_public?: boolean | null
    is_public_roadmap?: boolean | null
  }
  Relationships: [
    {
      foreignKeyName: "organizations_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
