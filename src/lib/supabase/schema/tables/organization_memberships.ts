import type { PublicEnums } from "../enums"

export type OrganizationMembershipsTable = {
  Row: {
    org_id: string
    member_id: string
    role: PublicEnums["organization_member_role"]
    member_email: string
    created_at: string
    updated_at: string
  }
  Insert: {
    org_id: string
    member_id: string
    role?: PublicEnums["organization_member_role"]
    member_email: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    org_id?: string
    member_id?: string
    role?: PublicEnums["organization_member_role"]
    member_email?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_memberships_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_memberships_member_id_fkey"
      columns: ["member_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}

