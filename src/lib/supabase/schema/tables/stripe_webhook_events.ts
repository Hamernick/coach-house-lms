import type { Json } from "../json"

export type StripeWebhookEventsTable = {
  Row: {
    id: string
    type: string
    payload: Json
    created_at: string
  }
  Insert: {
    id: string
    type: string
    payload: Json
    created_at?: string
  }
  Update: {
    id?: string
    type?: string
    payload?: Json
    created_at?: string
  }
  Relationships: []
}

