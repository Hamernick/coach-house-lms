import Link from "next/link"
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
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"]

  const { data } = await supabase
    .from("subscriptions" satisfies keyof Database["public"]["Tables"])
    .select("status, current_period_end, metadata")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<SubscriptionRow, "status" | "current_period_end" | "metadata">>()

  const subscription = data

  if (!subscription) {
    return (
      <Card className="mx-4 border bg-card/60 lg:mx-6">
        <CardHeader>
          <CardTitle className="text-lg">Subscription status</CardTitle>
          <CardDescription>
            No billing information yet. Visit the pricing page to start a trial.
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

  const metadata =
    typeof subscription.metadata === "object" && subscription.metadata
      ? (subscription.metadata as Record<string, string | null>)
      : null
  const planName = metadata?.planName ?? undefined

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
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          {isTrial
            ? "Upgrade before the trial ends to keep access to private courses and automation."
            : isActive
            ? "Thank you for supporting Coach House. Your team has full access to premium features."
            : "Resume your subscription to continue engaging your learners."}
        </p>
        <p>
          Billing management is coming soon. Until then, contact{' '}
          <Link
            href="mailto:support@coachhouse.io"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            support@coachhouse.io
          </Link>{' '}for plan changes.
        </p>
      </CardContent>
    </Card>
  )
}
