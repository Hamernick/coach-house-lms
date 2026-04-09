import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StripePoweredBadge } from "@/components/billing/stripe-powered-badge"

import { BillingPortalButton } from "../billing-portal-button"

type BillingPortalCardProps = {
  portalReady: boolean
  hasPortalReference: boolean
  hasPaidPlan: boolean
}

export function BillingPortalCard({
  portalReady,
  hasPortalReference,
  hasPaidPlan,
}: BillingPortalCardProps) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Billing portal</CardTitle>
          <StripePoweredBadge />
        </div>
        <CardDescription>
          Open Stripe to manage payment methods, invoices, cancelation, renewal, and subscription details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {portalReady && hasPortalReference ? (
          <BillingPortalButton />
        ) : portalReady ? (
          <Button disabled variant="outline">
            Open billing portal
          </Button>
        ) : (
          <Button disabled variant="outline">
            Billing portal unavailable
          </Button>
        )}
        <p className="text-sm text-muted-foreground" data-tour="billing-support">
          {portalReady && !hasPortalReference ? (
            hasPaidPlan ? (
              <>
                We found your plan but not a complete Stripe billing record yet. Contact{" "}
                <a
                  href="mailto:support@coachhouse.io"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  support@coachhouse.io
                </a>{" "}
                and we can reconnect it.
              </>
            ) : (
              <>
                Start a paid plan first, then you&apos;ll be able to manage payment methods and invoices in Stripe.{" "}
                Need help? Contact{" "}
                <a
                  href="mailto:support@coachhouse.io"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  support@coachhouse.io
                </a>
                .
              </>
            )
          ) : (
            <>
              Need help? Contact{" "}
              <a
                href="mailto:support@coachhouse.io"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                support@coachhouse.io
              </a>
              .
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
