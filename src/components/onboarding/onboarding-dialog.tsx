"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { STEPS } from "./onboarding-dialog/constants"
import { OnboardingDialogContent, OnboardingDialogShell } from "./onboarding-dialog/components"
import { clearOnboardingDraft } from "./onboarding-dialog/draft"
import { type SaveOnboardingDraftExtra, writeOnboardingDraftSnapshot } from "./onboarding-dialog/draft-writer"
import { resolveOnboardingError } from "./onboarding-dialog/helpers"
import { useOnboardingAvatar } from "./onboarding-dialog/hooks/use-onboarding-avatar"
import { useOnboardingDefaults } from "./onboarding-dialog/hooks/use-onboarding-defaults"
import { useOnboardingDraftState } from "./onboarding-dialog/hooks/use-onboarding-draft-state"
import { useOnboardingFieldHandlers } from "./onboarding-dialog/hooks/use-onboarding-field-handlers"
import { useOnboardingProgress } from "./onboarding-dialog/hooks/use-onboarding-progress"
import { useSlugAvailability } from "./onboarding-dialog/hooks/use-slug-availability"
import {
  validateOnboardingStep,
} from "./onboarding-dialog/state-helpers"
import type {
  FormationStatus,
  IntentFocus,
  OnboardingDialogProps,
  RoleInterest,
} from "./onboarding-dialog/types"
export type { OnboardingDialogProps } from "./onboarding-dialog/types"

export function OnboardingDialog({
  open,
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
  onSubmit,
  presentation = "dialog",
}: OnboardingDialogProps) {
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
  const [formationStatus, setFormationStatus] =
    useState<FormationStatus | "">(initialFormationStatus)
  const [intentFocus, setIntentFocus] = useState<IntentFocus | "">(initialIntentFocus)
  const [roleInterest, setRoleInterest] = useState<RoleInterest | "">(initialRoleInterest)

  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null)
  const currentStep = STEPS[Math.max(0, Math.min(step, STEPS.length - 1))]
  const { slugStatus, slugHint } = useSlugAvailability({ open, slugValue })
  const { progress, syncProgress } = useOnboardingProgress({
    open,
    formRef,
    intentFocus,
    formationStatus,
    slugStatus,
  })

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

  const validateStep = (idx: number) => {
    if (!formRef.current) return false
    setAttemptedStep(idx)
    const form = new FormData(formRef.current)
    const nextErrors = validateOnboardingStep({
      stepIndex: idx,
      form,
      formationStatus,
      slugStatus,
      slugHint,
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    setServerError(null)
    if (!validateStep(step)) return
    setErrors({})
    setAttemptedStep(null)
    setStep((prev) => {
      const value = Math.min(prev + 1, STEPS.length - 1)
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
    saveDraft()
    syncProgress()

    if (STEPS[step]?.id === "account" && attemptedStep === step && formRef.current) {
      const data = new FormData(formRef.current)
      const firstName = String(data.get("firstName") ?? "").trim()
      const lastName = String(data.get("lastName") ?? "").trim()

      setErrors((prev) => {
        if (!prev.firstName && !prev.lastName) return prev
        const next = { ...prev }
        if (firstName) delete next.firstName
        if (lastName) delete next.lastName
        return next
      })

      if (firstName && lastName) {
        setAttemptedStep(null)
      }
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (step !== STEPS.length - 1) {
      event.preventDefault()
      next()
      return
    }
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
    handleOrgNameChange,
    handleOrgSlugChange,
  } = useOnboardingFieldHandlers({
    formRef,
    slugEdited,
    saveDraft,
    setErrors,
    setFormationStatus,
    setIntentFocus,
    setOrgNameValue,
    setOrgSlugInputValue,
    setSlugEdited,
    setSlugValue,
    syncProgress,
  })

  const stepLabel = `Step ${step + 1} of ${STEPS.length}`
  const content = (
    <OnboardingDialogContent
      formRef={formRef}
      avatarInputRef={avatarInputRef}
      step={step}
      totalSteps={STEPS.length}
      attemptedStep={attemptedStep}
      errors={errors}
      serverError={serverError}
      stepLabel={stepLabel}
      currentStep={currentStep}
      isInline={presentation === "inline"}
      intentFocus={intentFocus}
      roleInterest={roleInterest}
      formationStatus={formationStatus}
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
      avatarPreview={avatarPreview}
      submitting={submitting}
      progress={progress}
      cropOpen={cropOpen}
      rawImageUrl={rawImageUrl}
      crop={crop}
      zoom={zoom}
      onFormChange={handleFormChange}
      onFormSubmit={handleFormSubmit}
      onPrev={prev}
      onNext={next}
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

  return (
    <OnboardingDialogShell open={open} presentation={presentation}>
      {content}
    </OnboardingDialogShell>
  )
}
