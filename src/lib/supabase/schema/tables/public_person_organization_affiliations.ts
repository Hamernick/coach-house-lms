import type { PublicEnums } from "../enums"

export type PublicPersonOrganizationAffiliationsTable = {
  Row: {
    profile_id: string
    organization_id: string
    role: PublicEnums["organization_member_role"]
    created_at: string
    updated_at: string
  }
  Insert: {
    profile_id: string
    organization_id: string
    role: PublicEnums["organization_member_role"]
    created_at?: string
    updated_at?: string
  }
  Update: {
    profile_id?: string
    organization_id?: string
    role?: PublicEnums["organization_member_role"]
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_person_organization_affiliations_profile_id_fkey"
      columns: ["profile_id"]
      referencedRelation: "public_person_profiles"
      referencedColumns: ["profile_id"]
    },
    {
      foreignKeyName: "public_person_organization_affiliations_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
