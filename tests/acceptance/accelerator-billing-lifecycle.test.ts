import { describe, expect, it } from "vitest"

import {
  parseInstallmentCount,
  resolveNextInstallmentProgress,
  shouldRollToOrganizationPlan,
} from "@/lib/accelerator/billing-lifecycle"

describe("accelerator billing lifecycle helpers", () => {
  it("parses installment counts safely", () => {
    expect(parseInstallmentCount("6", 4)).toBe(6)
    expect(parseInstallmentCount("0", 4)).toBe(0)
    expect(parseInstallmentCount("not-a-number", 4)).toBe(4)
    expect(parseInstallmentCount("-1", 4)).toBe(4)
    expect(parseInstallmentCount(undefined, 4)).toBe(4)
  })

  it("marks installment progress and cancel-at-period-end when the limit is reached", () => {
    const progress = resolveNextInstallmentProgress({
      billingReason: "subscription_cycle",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
        accelerator_installment_limit: "10",
        accelerator_installments_paid: "9",
      },
      cancelAtPeriodEnd: false,
    })

    expect(progress.eligible).toBe(true)
    expect(progress.nextInstallmentsPaid).toBe(10)
    expect(progress.shouldSetCancelAtPeriodEnd).toBe(true)
  })

  it("does not count non-cycle invoices for installment progression", () => {
    const progress = resolveNextInstallmentProgress({
      billingReason: "manual",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
        accelerator_installment_limit: "10",
        accelerator_installments_paid: "2",
      },
      cancelAtPeriodEnd: false,
    })

    expect(progress.eligible).toBe(false)
    expect(progress.shouldSetCancelAtPeriodEnd).toBe(false)
  })

  it("requires installment completion before organization rollover", () => {
    const earlyCancellation = shouldRollToOrganizationPlan({
      eventType: "customer.subscription.deleted",
      subscriptionStatus: "canceled",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
        accelerator_installment_limit: "10",
        accelerator_installments_paid: "3",
      },
    })

    const completedTermCancellation = shouldRollToOrganizationPlan({
      eventType: "customer.subscription.deleted",
      subscriptionStatus: "canceled",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
        accelerator_installment_limit: "10",
        accelerator_installments_paid: "10",
      },
    })

    expect(earlyCancellation).toBe(false)
    expect(completedTermCancellation).toBe(true)
  })

  it("allows rollover for legacy monthly subscriptions without installment metadata", () => {
    const legacyCancellation = shouldRollToOrganizationPlan({
      eventType: "customer.subscription.deleted",
      subscriptionStatus: "canceled",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
      },
    })

    expect(legacyCancellation).toBe(true)
  })

  it("does not roll over on non-cancellation events even when installments are complete", () => {
    const stillActive = shouldRollToOrganizationPlan({
      eventType: "customer.subscription.updated",
      subscriptionStatus: "active",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
        accelerator_installment_limit: "10",
        accelerator_installments_paid: "10",
      },
    })

    expect(stillActive).toBe(false)
  })

  it("caps installment progression at limit and avoids duplicate cancel-at-period-end toggles", () => {
    const progress = resolveNextInstallmentProgress({
      billingReason: "subscription_cycle",
      metadata: {
        kind: "accelerator",
        accelerator_billing: "monthly",
        accelerator_installment_limit: "10",
        accelerator_installments_paid: "10",
      },
      cancelAtPeriodEnd: true,
    })

    expect(progress.eligible).toBe(true)
    expect(progress.nextInstallmentsPaid).toBe(10)
    expect(progress.shouldSetCancelAtPeriodEnd).toBe(false)
  })
})
