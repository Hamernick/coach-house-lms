"use client"

import { useEffect } from "react"

import type {
  OnboardingAccountValues,
  OnboardingOrganizationValues,
} from "@/components/onboarding/onboarding-dialog/state-helpers"

export function useOnboardingCarryForwardRefs({
  accountValues,
  accountValuesRef,
  orgNameValue,
  orgSlugInputValue,
  slugValue,
  organizationValuesRef,
}: {
  accountValues: OnboardingAccountValues
  accountValuesRef: React.MutableRefObject<OnboardingAccountValues>
  orgNameValue: string
  orgSlugInputValue: string
  slugValue: string
  organizationValuesRef: React.MutableRefObject<OnboardingOrganizationValues>
}) {
  useEffect(() => {
    organizationValuesRef.current = {
      orgName: orgNameValue,
      orgSlug: orgSlugInputValue || slugValue,
    }
  }, [orgNameValue, orgSlugInputValue, slugValue, organizationValuesRef])

  useEffect(() => {
    accountValuesRef.current = accountValues
  }, [accountValues, accountValuesRef])
}
