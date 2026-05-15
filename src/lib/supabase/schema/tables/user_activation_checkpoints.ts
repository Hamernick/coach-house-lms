import type { Json } from "../json"

export type UserActivationCheckpointsTable = {
  Row: {
    id: string
    user_id: string
    org_id: string
    checkpoint: string
    source_event_id: string | null
    metadata: Json
    completed_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    org_id: string
    checkpoint: string
    source_event_id?: string | null
    metadata?: Json
    completed_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    org_id?: string
    checkpoint?: string
    source_event_id?: string | null
    metadata?: Json
    completed_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "user_activation_checkpoints_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "user_activation_checkpoints_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "user_activation_checkpoints_source_event_id_fkey"
      columns: ["source_event_id"]
      isOneToOne: false
      referencedRelation: "user_journey_events"
      referencedColumns: ["id"]
    },
  ]
}
