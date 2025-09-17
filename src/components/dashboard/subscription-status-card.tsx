import { formatDistanceToNow } from "date-fns"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete",
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ")
}

export async function SubscriptionStatusCard() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"]

  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, metadata")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  type SubscriptionData = Pick<SubscriptionRow, "status" | "current_period_end" | "metadata">
  const subscription = (data as SubscriptionData | null)

  if (!subscription) {
    return (
      <Card className="mx-4 border bg-card/60 lg:mx-6">
        <CardHeader>
          <CardTitle className="text-lg">Subscription status</CardTitle>
          <CardDescription>
            No billing information yet. Start a trial from the pricing page to unlock premium features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Unsubscribed</Badge>
        </CardContent>
      </Card>
    )
  }

  const statusText = statusLabel(subscription.status)
  const isActive = subscription.status === "active"
  const isTrial = subscription.status === "trialing"

  const periodText = subscription.current_period_end
    ? formatDistanceToNow(new Date(subscription.current_period_end), { addSuffix: true })
    : null

  const planMetadata =
    typeof subscription.metadata === "object" && subscription.metadata
      ? (subscription.metadata as Record<string, string | null>)
      : null
  const planName = planMetadata?.planName ?? undefined

  const descriptionParts: string[] = []
  if (planName) {
    descriptionParts.push(`${planName} plan.`)
  }
  if (periodText) {
    if (isTrial) {
      descriptionParts.push(`Trial converts ${periodText}.`)
    } else if (isActive) {
      descriptionParts.push(`Renews ${periodText}.`)
    }
  }
  if (descriptionParts.length === 0) {
    descriptionParts.push("Manage billing from the pricing page any time.")
  }

  return (
    <Card className="mx-4 border bg-card/60 lg:mx-6">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subscription status</CardTitle>
          <Badge variant={isActive ? "default" : "outline"}>{statusText}</Badge>
        </div>
        <CardDescription>{descriptionParts.join(" ")}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {isTrial
          ? "Upgrade before the trial ends to keep access to private courses and automation."
          : isActive
          ? "Thank you for supporting Coach House. Your team has full access to premium features."
          : "Resume your subscription to continue engaging your learners."}
      </CardContent>
    </Card>
  )
}
