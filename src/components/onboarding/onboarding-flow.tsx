"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import { resolveOnboardingSteps } from "./onboarding-dialog/constants"
import { OnboardingDialogContent } from "./onboarding-dialog/components"
import { clearOnboardingDraft } from "./onboarding-dialog/draft"
import {
  type SaveOnboardingDraftExtra,
  writeOnboardingDraftSnapshot,
} from "./onboarding-dialog/draft-writer"
import { resolveOnboardingError } from "./onboarding-dialog/helpers"
import { useOnboardingAvatar } from "./onboarding-dialog/hooks/use-onboarding-avatar"
import { useOnboardingDefaults } from "./onboarding-dialog/hooks/use-onboarding-defaults"
import { useOnboardingCarryForwardRefs } from "./onboarding-dialog/hooks/use-onboarding-carry-forward-refs"
import { useOnboardingDraftState } from "./onboarding-dialog/hooks/use-onboarding-draft-state"
import { useOnboardingFieldHandlers } from "./onboarding-dialog/hooks/use-onboarding-field-handlers"
import {
  buildInitialAccountValues,
  clearResolvedAccountStepErrors,
  useOnboardingAccountStateSync,
  useOnboardingStateSnapshot,
  useOnboardingStepFocus,
} from "./onboarding-dialog/hooks/use-onboarding-flow-state-sync"
import { useOnboardingProgress } from "./onboarding-dialog/hooks/use-onboarding-progress"
import { useSlugAvailability } from "./onboarding-dialog/hooks/use-slug-availability"
import {
  isOnboardingAccountStepReady,
  syncOnboardingCarryForwardInputs,
  validateOnboardingStep,
} from "./onboarding-dialog/state-helpers"
import type {
  FormationStatus,
  IntentFocus,
  OnboardingFlowDefaults,
  RoleInterest,
} from "./onboarding-dialog/types"

type OnboardingFlowProps = OnboardingFlowDefaults & {
  open?: boolean
  isInline: boolean
  onSubmit: (form: FormData) => Promise<void>
}

export function OnboardingFlow({
  open = true,
  isInline,
  defaultEmail,
  defaultOrgName,
  defaultOrgSlug,
  defaultFormationStatus,
  defaultIntentFocus,
  defaultRoleInterest,
  defaultFirstName,
  defaultLastName,
  defaultPhone,
  defaultPublicEmail,
  defaultTitle,
  defaultLinkedin,
  defaultAvatarUrl,
  defaultOptInUpdates,
  defaultNewsletterOptIn,
  defaultBuilderPlanTier = "free",
  onSubmit,
}: OnboardingFlowProps) {
  const {
    initialOrgName,
    initialOrgSlug,
    initialFormationStatus,
    initialIntentFocus,
    initialRoleInterest,
    initialFirstName,
    initialLastName,
    initialPhone,
    initialPublicEmail,
    initialTitle,
    initialLinkedin,
    initialAvatarUrl,
    initialOptInUpdates,
    initialNewsletterOptIn,
    resolveDraftFieldValue,
  } = useOnboardingDefaults({
    defaultEmail,
    defaultOrgName,
    defaultOrgSlug,
    defaultFormationStatus,
    defaultIntentFocus,
    defaultRoleInterest,
    defaultFirstName,
    defaultLastName,
    defaultPhone,
    defaultPublicEmail,
    defaultTitle,
    defaultLinkedin,
    defaultAvatarUrl,
    defaultOptInUpdates,
    defaultNewsletterOptIn,
  })

  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const [orgNameValue, setOrgNameValue] = useState(initialOrgName)
  const [orgSlugInputValue, setOrgSlugInputValue] = useState(initialOrgSlug)
  const [slugValue, setSlugValue] = useState(initialOrgSlug)
  const [formationStatus, setFormationStatus] = useState<FormationStatus | "">(initialFormationStatus)
  const [intentFocus, setIntentFocus] = useState<IntentFocus | "">(initialIntentFocus)
  const [roleInterest, setRoleInterest] = useState<RoleInterest | "">(initialRoleInterest)
  const builderPlanTier: PricingPlanTier = defaultBuilderPlanTier ?? "free"
  const [submitting, setSubmitting] = useState(false)
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null)
  const [accountStepReady, setAccountStepReady] = useState(() =>
    isOnboardingAccountStepReady({ firstName: initialFirstName, lastName: initialLastName }),
  )
  const [accountValues, setAccountValues] = useState(() =>
    buildInitialAccountValues({
      firstName: initialFirstName, lastName: initialLastName, phone: initialPhone,
      publicEmail: initialPublicEmail, title: initialTitle, linkedin: initialLinkedin,
      optInUpdates: initialOptInUpdates, newsletterOptIn: initialNewsletterOptIn,
    }),
  )
  const latestOrganizationValuesRef = useRef({ orgName: initialOrgName, orgSlug: initialOrgSlug })
  const latestAccountValuesRef = useRef(accountValues)

  const formRef = useRef<HTMLFormElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const steps = React.useMemo(() => resolveOnboardingSteps(intentFocus), [intentFocus])
  const currentStep = steps[Math.max(0, Math.min(step, steps.length - 1))]
  const { slugStatus, slugHint } = useSlugAvailability({ open, slugValue })
  const { syncProgress } = useOnboardingProgress({
    open,
    formRef,
    intentFocus,
    formationStatus,
    slugStatus,
  })
  const stepProgress = React.useMemo(() => Math.round(((step + 1) / Math.max(steps.length, 1)) * 100), [step, steps.length])

  const saveDraft = (extra?: SaveOnboardingDraftExtra) => {
    writeOnboardingDraftSnapshot({
      formRef,
      step,
      formationStatus,
      intentFocus,
      roleInterest,
      slugEdited,
      avatar: avatarPreview,
      extra,
    })
  }

  const { syncAccountStateFromForm, syncOrganizationStateFromForm } =
    useOnboardingStateSnapshot({
      formRef,
      setAccountStepReady,
      setAccountValues,
      setOrgNameValue,
      setOrgSlugInputValue,
      setSlugValue,
      accountValuesRef: latestAccountValuesRef,
      organizationValuesRef: latestOrganizationValuesRef,
    })

  useOnboardingCarryForwardRefs({
    accountValues,
    accountValuesRef: latestAccountValuesRef,
    orgNameValue,
    orgSlugInputValue,
    slugValue,
    organizationValuesRef: latestOrganizationValuesRef,
  })

  const {
    avatarPreview,
    crop,
    cropOpen,
    handleApplyCrop,
    handleAvatarSelect,
    rawImageUrl,
    removeAvatar,
    setAvatarPreview,
    setCrop,
    setCropOpen,
    setCroppedArea,
    setZoom,
    zoom,
  } = useOnboardingAvatar({
    initialAvatarUrl,
    formRef,
    saveDraft,
  })

  useOnboardingDraftState({
    open,
    step,
    formRef,
    resolveDraftFieldValue,
    setStep,
    setFormationStatus,
    setIntentFocus,
    setRoleInterest,
    setSlugEdited,
    setAvatarPreview,
    setAccountStepReady,
    setAccountValues,
    setOrgNameValue,
    setOrgSlugInputValue,
    setSlugValue,
    syncProgress,
  })

  useEffect(() => {
    if (!open) return
    const msg = resolveOnboardingError(searchParams.get("error"))
    setServerError(msg)
  }, [open, searchParams])

  useEffect(() => {
    setAttemptedStep(null)
    setErrors({})
  }, [step])

  useEffect(() => {
    if (step <= steps.length - 1) return
    setStep(steps.length - 1)
  }, [step, steps.length])

  useOnboardingStepFocus({
    open,
    currentStepId: currentStep.id,
    formRef,
  })

  useOnboardingAccountStateSync({
    open,
    step,
    formRef,
    syncAccountStateFromForm,
  })

  const validateStep = (idx: number) => {
    if (!formRef.current) return false
    setAttemptedStep(idx)
    const form = new FormData(formRef.current)
    const nextErrors = validateOnboardingStep({
      stepIndex: idx,
      form,
      formationStatus,
      intentFocus,
      slugStatus,
      slugHint,
      builderPlanTier,
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    setServerError(null)
    syncOrganizationStateFromForm()
    syncAccountStateFromForm()
    if (!validateStep(step)) return
    setErrors({})
    setAttemptedStep(null)
    setStep((prev) => {
      const value = Math.min(prev + 1, steps.length - 1)
      saveDraft({ step: value })
      return value
    })
  }

  const prev = () => {
    setServerError(null)
    setErrors({})
    setAttemptedStep(null)
    setStep((prev) => {
      const value = Math.max(prev - 1, 0)
      saveDraft({ step: value })
      return value
    })
  }

  const handleFormChange = () => {
    syncOrganizationStateFromForm()
    saveDraft()
    syncProgress()
    syncAccountStateFromForm()

    if (steps[step]?.id === "account" && attemptedStep === step && formRef.current) {
      const data = new FormData(formRef.current)
      const firstName = String(data.get("firstName") ?? "").trim()
      const lastName = String(data.get("lastName") ?? "").trim()

      setErrors((previous) =>
        clearResolvedAccountStepErrors({
          previousErrors: previous,
          firstName,
          lastName,
        }),
      )

      if (firstName && lastName) {
        setAttemptedStep(null)
      }
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (step !== steps.length - 1) {
      event.preventDefault()
      next()
      return
    }
    syncOrganizationStateFromForm()
    syncAccountStateFromForm()
    syncOnboardingCarryForwardInputs({
      form: formRef.current,
      intentFocus,
      roleInterest,
      formationStatus,
      organizationValues: latestOrganizationValuesRef.current,
      accountValues: latestAccountValuesRef.current,
    })
    if (!validateStep(step)) {
      event.preventDefault()
      return
    }

    setSubmitting(true)
    saveDraft({ step })
    clearOnboardingDraft()
  }

  const {
    handleFormationStatusSelect,
    handleIntentSelect,
    handleOrgNameChange,
    handleOrgSlugChange,
  } = useOnboardingFieldHandlers({
    formRef,
    slugEdited,
    saveDraft,
    syncProgress,
    setErrors,
    setFormationStatus,
    setIntentFocus,
    setOrgNameValue,
    setOrgSlugInputValue,
    setSlugEdited,
    setSlugValue,
  })

  return (
    <OnboardingDialogContent
      formRef={formRef}
      avatarInputRef={avatarInputRef}
      step={step}
      totalSteps={steps.length}
      attemptedStep={attemptedStep}
      errors={errors}
      serverError={serverError}
      stepLabel={`Step ${step + 1} of ${steps.length}`}
      currentStep={currentStep}
      isInline={isInline}
      intentFocus={intentFocus}
      roleInterest={roleInterest}
      formationStatus={formationStatus}
      builderPlanTier={builderPlanTier}
      accountStepReady={accountStepReady}
      orgNameValue={orgNameValue}
      orgSlugInputValue={orgSlugInputValue}
      slugValue={slugValue}
      initialOrgName={initialOrgName}
      initialOrgSlug={initialOrgSlug}
      slugStatus={slugStatus}
      slugHint={slugHint}
      initialFirstName={initialFirstName}
      initialLastName={initialLastName}
      initialPhone={initialPhone}
      initialPublicEmail={initialPublicEmail}
      initialTitle={initialTitle}
      initialLinkedin={initialLinkedin}
      initialOptInUpdates={initialOptInUpdates}
      initialNewsletterOptIn={initialNewsletterOptIn}
      accountValues={accountValues}
      avatarPreview={avatarPreview}
      submitting={submitting}
      progress={stepProgress}
      cropOpen={cropOpen}
      rawImageUrl={rawImageUrl}
      crop={crop}
      zoom={zoom}
      onFormChange={handleFormChange}
      onFormSubmit={handleFormSubmit}
      onPrev={prev}
      onNext={next}
      onSelectIntent={handleIntentSelect}
      onOrgNameChange={handleOrgNameChange}
      onOrgSlugChange={handleOrgSlugChange}
      onFormationStatusSelect={handleFormationStatusSelect}
      onAvatarSelect={handleAvatarSelect}
      onRemoveAvatar={removeAvatar}
      onCropOpenChange={setCropOpen}
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={setCroppedArea}
      onApplyCrop={handleApplyCrop}
      onSubmitAction={onSubmit}
    />
  )
}
