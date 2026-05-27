export type CoachingBookingsTable = {
  Row: {
    id: string
    org_id: string
    user_id: string
    coach_id: string
    status: string
    price_tier: string
    starts_at: string
    ends_at: string
    timezone: string
    hold_expires_at: string | null
    confirmed_at: string | null
    canceled_at: string | null
    cancel_reason: string | null
    rescheduled_from_booking_id: string | null
    stripe_checkout_session_id: string | null
    stripe_payment_intent_id: string | null
    stripe_customer_id: string | null
    google_event_id: string | null
    google_event_html_link: string | null
    google_meet_url: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    user_id: string
    coach_id: string
    status?: string
    price_tier?: string
    starts_at: string
    ends_at: string
    timezone?: string
    hold_expires_at?: string | null
    confirmed_at?: string | null
    canceled_at?: string | null
    cancel_reason?: string | null
    rescheduled_from_booking_id?: string | null
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    stripe_customer_id?: string | null
    google_event_id?: string | null
    google_event_html_link?: string | null
    google_meet_url?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    user_id?: string
    coach_id?: string
    status?: string
    price_tier?: string
    starts_at?: string
    ends_at?: string
    timezone?: string
    hold_expires_at?: string | null
    confirmed_at?: string | null
    canceled_at?: string | null
    cancel_reason?: string | null
    rescheduled_from_booking_id?: string | null
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    stripe_customer_id?: string | null
    google_event_id?: string | null
    google_event_html_link?: string | null
    google_meet_url?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "coaching_bookings_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "coaching_bookings_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "coaching_bookings_coach_id_fkey"
      columns: ["coach_id"]
      referencedRelation: "coaching_coaches"
      referencedColumns: ["id"]
    },
  ]
}
