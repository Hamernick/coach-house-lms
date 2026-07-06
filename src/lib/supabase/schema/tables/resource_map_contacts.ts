import type { Json } from "../json"

export type ResourceMapContactsTable = {
  Row: {
    id: string
    organization_id: string
    service_id: string | null
    contact_type: string
    label: string | null
    value: string
    url: string | null
    is_primary: boolean
    is_public: boolean
    metadata: Json
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    organization_id: string
    service_id?: string | null
    contact_type: string
    label?: string | null
    value: string
    url?: string | null
    is_primary?: boolean
    is_public?: boolean
    metadata?: Json
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    organization_id?: string
    service_id?: string | null
    contact_type?: string
    label?: string | null
    value?: string
    url?: string | null
    is_primary?: boolean
    is_public?: boolean
    metadata?: Json
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_contacts_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_contacts_service_org_fkey"
      columns: ["service_id", "organization_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id", "organization_id"]
    },
  ]
}
