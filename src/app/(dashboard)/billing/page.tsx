import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BillingPlaceholderPage() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      <Card className="border-dashed bg-card/70">
        <CardHeader>
          <CardTitle>Billing management coming soon</CardTitle>
          <CardDescription>
            Stripe customer portal integration ships in a later step. For now, reach out and our
            team will adjust your subscription manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm text-muted-foreground">
            Need to upgrade, downgrade, or change payment methods? Email
            <a
              href="mailto:support@coachhouse.io"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {" "}support@coachhouse.io
            </a>
            and include your workspace name.
          </div>
          <Button asChild variant="outline" className="self-start">
            <a href="/pricing">View plans</a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>What to expect next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Stripe customer portal link will appear here once credentials are connected.</p>
          <p>• Subscription status on the dashboard already reflects the latest webhook data.</p>
          <p>• Webhook events are stored in Supabase for replay-safe processing.</p>
        </CardContent>
      </Card>
    </div>
  )
}
