import type { Json } from "../json"

export type ResourceMapLocationsTable = {
  Row: {
    id: string
    organization_id: string
    service_id: string | null
    label: string | null
    location_type: string
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    county: string | null
    postal_code: string | null
    country: string
    latitude: number | null
    longitude: number | null
    geo_point: unknown | null
    geocoding_accuracy: string | null
    service_radius_miles: number | null
    location_url: string | null
    service_area: string[]
    accessibility_notes: string | null
    hours: Json
    hours_schema_version: number
    timezone: string | null
    appointment_required: boolean
    availability_status: string
    availability_notes: string | null
    temporary_closed_until: string | null
    is_primary: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    organization_id: string
    service_id?: string | null
    label?: string | null
    location_type?: string
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    county?: string | null
    postal_code?: string | null
    country?: string
    latitude?: number | null
    longitude?: number | null
    geocoding_accuracy?: string | null
    service_radius_miles?: number | null
    location_url?: string | null
    service_area?: string[]
    accessibility_notes?: string | null
    hours?: Json
    hours_schema_version?: number
    timezone?: string | null
    appointment_required?: boolean
    availability_status?: string
    availability_notes?: string | null
    temporary_closed_until?: string | null
    is_primary?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    organization_id?: string
    service_id?: string | null
    label?: string | null
    location_type?: string
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    county?: string | null
    postal_code?: string | null
    country?: string
    latitude?: number | null
    longitude?: number | null
    geocoding_accuracy?: string | null
    service_radius_miles?: number | null
    location_url?: string | null
    service_area?: string[]
    accessibility_notes?: string | null
    hours?: Json
    hours_schema_version?: number
    timezone?: string | null
    appointment_required?: boolean
    availability_status?: string
    availability_notes?: string | null
    temporary_closed_until?: string | null
    is_primary?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_locations_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_locations_service_org_fkey"
      columns: ["service_id", "organization_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id", "organization_id"]
    },
  ]
}
