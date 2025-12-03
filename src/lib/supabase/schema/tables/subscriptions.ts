import type { Json } from "../json"
import type { PublicEnums } from "../enums"

export type SubscriptionsTable = {
  Row: {
    id: string
    user_id: string
    stripe_customer_id: string | null
    stripe_subscription_id: string
    status: PublicEnums["subscription_status"]
    current_period_end: string | null
    cancel_at: string | null
    canceled_at: string | null
    created_at: string
    updated_at: string
    metadata: Json | null
  }
  Insert: {
    id?: string
    user_id: string
    stripe_customer_id?: string | null
    stripe_subscription_id: string
    status?: PublicEnums["subscription_status"]
    current_period_end?: string | null
    cancel_at?: string | null
    canceled_at?: string | null
    created_at?: string
    updated_at?: string
    metadata?: Json | null
  }
  Update: {
    id?: string
    user_id?: string
    stripe_customer_id?: string | null
    stripe_subscription_id?: string
    status?: PublicEnums["subscription_status"]
    current_period_end?: string | null
    cancel_at?: string | null
    canceled_at?: string | null
    created_at?: string
    updated_at?: string
    metadata?: Json | null
  }
  Relationships: [
    {
      foreignKeyName: "subscriptions_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}

