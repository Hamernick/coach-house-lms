import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"

// Record money received even when its original time can no longer be confirmed.
export async function recordPurchasedCoachingCredit({
  admin,
  booking,
  checkoutId,
}: {
  admin: SupabaseClient<Database>
  booking: { user_id: string; org_id: string }
  checkoutId: string
}) {
  const result = await admin.rpc("issue_coaching_credits", {
    p_user_id: booking.user_id,
    p_org_id: booking.org_id,
    p_quantity: 1,
    p_source_type: "purchased",
    p_label: "Purchased Coaching",
    p_reason: "Paid coaching session",
    p_expires_at: null,
    p_actor_id: null,
    p_request_key: `checkout:${checkoutId}`,
  })
  if (result.error)
    throw new Error("Unable to record the paid coaching credit.")
}
