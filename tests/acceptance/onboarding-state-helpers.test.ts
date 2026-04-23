import { describe, expect, it } from "vitest"

import {
  isOnboardingAccountStepReady,
  readOnboardingAccountValues,
  readOnboardingOrganizationValues,
  validateOnboardingStep,
} from "@/components/onboarding/onboarding-dialog/state-helpers"

describe("onboarding state helpers", () => {
  it("only marks the account step ready when both first and last names are present", () => {
    expect(
      isOnboardingAccountStepReady({
        firstName: "",
        lastName: "",
      }),
    ).toBe(false)

    expect(
      isOnboardingAccountStepReady({
        firstName: "Jordan",
        lastName: "",
      }),
    ).toBe(false)

    expect(
      isOnboardingAccountStepReady({
        firstName: "Jordan",
        lastName: "Rivers",
      }),
    ).toBe(true)
  })

  it("allows both free and paid builder plans on the pricing step", () => {
    const form = new FormData()
    form.set("intentFocus", "build")

    expect(
      validateOnboardingStep({
        stepIndex: 1,
        form,
        formationStatus: "",
        intentFocus: "build",
        slugStatus: "idle",
        slugHint: null,
        builderPlanTier: "free",
      }),
    ).toEqual({})

    expect(
      validateOnboardingStep({
        stepIndex: 1,
        form,
        formationStatus: "",
        intentFocus: "build",
        slugStatus: "idle",
        slugHint: null,
        builderPlanTier: "organization",
      }),
    ).toEqual({})
  })

  it("reads account values from the live form data snapshot", () => {
    const form = new FormData()
    form.set("firstName", "James")
    form.set("lastName", "Smith")
    form.set("phone", "773-333-3333")
    form.set("publicEmail", "contact@daerdy.com")
    form.set("title", "Founder")
    form.set("linkedin", "https://linkedin.com/in/jamessmith")
    form.set("optInUpdates", "on")

    expect(readOnboardingAccountValues(form)).toEqual({
      firstName: "James",
      lastName: "Smith",
      phone: "773-333-3333",
      publicEmail: "contact@daerdy.com",
      title: "Founder",
      linkedin: "https://linkedin.com/in/jamessmith",
      optInUpdates: true,
      newsletterOptIn: false,
    })
  })

  it("reads organization values from the live form data snapshot", () => {
    const form = new FormData()
    form.set("orgName", "Bright Futures Collective")
    form.set("orgSlug", "Bright Futures Collective ")

    expect(readOnboardingOrganizationValues(form)).toEqual({
      orgName: "Bright Futures Collective",
      orgSlug: "bright-futures-collective",
    })
  })
})
