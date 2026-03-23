import type { PublicEnums } from "../enums"

export type OrganizationAccessRequestsTable = {
  Row: {
    id: string
    org_id: string
    invitee_user_id: string
    invitee_email: string
    role: PublicEnums["organization_member_role"]
    status: string
    invited_by_user_id: string | null
    organization_invite_id: string | null
    message: string | null
    created_at: string
    responded_at: string | null
    expires_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    invitee_user_id: string
    invitee_email: string
    role?: PublicEnums["organization_member_role"]
    status?: string
    invited_by_user_id?: string | null
    organization_invite_id?: string | null
    message?: string | null
    created_at?: string
    responded_at?: string | null
    expires_at: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    invitee_user_id?: string
    invitee_email?: string
    role?: PublicEnums["organization_member_role"]
    status?: string
    invited_by_user_id?: string | null
    organization_invite_id?: string | null
    message?: string | null
    created_at?: string
    responded_at?: string | null
    expires_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_access_requests_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_access_requests_invitee_user_id_fkey"
      columns: ["invitee_user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_access_requests_invited_by_user_id_fkey"
      columns: ["invited_by_user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_access_requests_organization_invite_id_fkey"
      columns: ["organization_invite_id"]
      referencedRelation: "organization_invites"
      referencedColumns: ["id"]
    },
  ]
}
