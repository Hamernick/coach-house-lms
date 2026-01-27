import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { env } from "@/lib/env"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"

import { BillingPortalButton } from "./billing-portal-button"

const PORTAL_READY = Boolean(env.STRIPE_SECRET_KEY)

export default function BillingPlaceholderPage() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      <PageTutorialButton tutorial="billing" />
      <Card className="border-dashed bg-card/70">
        <CardHeader>
          <CardTitle>Billing management</CardTitle>
          <CardDescription>
            {PORTAL_READY
              ? "Manage your subscription through the Stripe customer portal."
              : "Stripe customer portal integration ships in a later step. For now, reach out and our team will adjust your subscription manually."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm text-muted-foreground">
            {PORTAL_READY ? (
              <>Open the portal to update payment methods, change plan, or cancel/resume your subscription.</>
            ) : (
              <>Need to upgrade, downgrade, or change payment methods? Email</>
            )}
            <a
              href="mailto:support@coachhouse.io"
              data-tour="billing-support"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {" "}support@coachhouse.io
            </a>
            {PORTAL_READY ? " if you need additional help." : " and include your workspace name."}
          </div>
          {PORTAL_READY ? (
            <BillingPortalButton />
          ) : (
            <Button asChild variant="outline" className="self-start" data-tour="billing-primary-action">
              <Link href="/pricing">View plans</Link>
            </Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>What to expect next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • {PORTAL_READY
              ? "Stripe customer portal is now available for self-serve management."
              : "Stripe customer portal link will appear here once credentials are connected."}
          </p>
          <p>• Subscription status on the dashboard already reflects the latest webhook data.</p>
          <p>• Webhook events are stored in Supabase for replay-safe processing.</p>
        </CardContent>
      </Card>
    </div>
  )
}
