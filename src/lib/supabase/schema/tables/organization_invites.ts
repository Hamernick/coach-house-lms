import type { PublicEnums } from "../enums"

export type OrganizationInvitesTable = {
  Row: {
    id: string
    org_id: string
    email: string
    role: PublicEnums["organization_member_role"]
    token: string
    expires_at: string
    invited_by: string | null
    accepted_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    email: string
    role?: PublicEnums["organization_member_role"]
    token: string
    expires_at: string
    invited_by?: string | null
    accepted_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    email?: string
    role?: PublicEnums["organization_member_role"]
    token?: string
    expires_at?: string
    invited_by?: string | null
    accepted_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_invites_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_invites_invited_by_fkey"
      columns: ["invited_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}

