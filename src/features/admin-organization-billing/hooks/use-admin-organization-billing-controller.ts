"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ADMIN_ORGANIZATION_BILLING_PLAN_LABELS } from "../lib"
import type {
  AdminOrganizationBillingPlan,
  ChangeAdminOrganizationBillingPlanAction,
  RefundLatestAdminOrganizationPaymentAction,
} from "../types"

export function useAdminOrganizationBillingController({
  changePlanAction,
  orgId,
  refundLatestPaymentAction,
}: {
  changePlanAction: ChangeAdminOrganizationBillingPlanAction
  orgId: string
  refundLatestPaymentAction: RefundLatestAdminOrganizationPaymentAction
}) {
  const router = useRouter()
  const [changePlanTarget, setChangePlanTarget] =
    useState<AdminOrganizationBillingPlan | null>(null)
  const [refundOpen, setRefundOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changePending, startChangeTransition] = useTransition()
  const [refundPending, startRefundTransition] = useTransition()

  const closeChangePlan = () => {
    if (changePending) return
    setChangePlanTarget(null)
    setError(null)
  }

  const closeRefund = () => {
    if (refundPending) return
    setRefundOpen(false)
    setError(null)
  }

  const confirmChangePlan = () => {
    if (!changePlanTarget) return
    setError(null)
    startChangeTransition(async () => {
      const result = await changePlanAction({
        orgId,
        plan: changePlanTarget,
      })
      if ("error" in result) {
        setError(result.error)
        return
      }

      toast.success(
        `Plan changed to ${ADMIN_ORGANIZATION_BILLING_PLAN_LABELS[changePlanTarget]}`
      )
      setChangePlanTarget(null)
      router.refresh()
    })
  }

  const confirmRefund = () => {
    setError(null)
    startRefundTransition(async () => {
      const result = await refundLatestPaymentAction({ orgId })
      if ("error" in result) {
        setError(result.error)
        return
      }

      toast.success(
        result.refundStatus === "succeeded"
          ? "Payment refunded"
          : "Refund submitted"
      )
      setRefundOpen(false)
      router.refresh()
    })
  }

  return {
    changePending,
    changePlanTarget,
    closeChangePlan,
    closeRefund,
    confirmChangePlan,
    confirmRefund,
    error,
    refundOpen,
    refundPending,
    setChangePlanTarget: (plan: AdminOrganizationBillingPlan) => {
      setError(null)
      setChangePlanTarget(plan)
    },
    setRefundOpen: () => {
      setError(null)
      setRefundOpen(true)
    },
  }
}
