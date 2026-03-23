"use client"

import * as React from "react"

import {
  AccountStep,
} from "./account-step"
import {
  AvatarCropDialog,
} from "./avatar-crop-dialog"
import {
  CommunityStep,
} from "./community-step"
import {
  IntentStep,
} from "./intent-step"
import {
  PricingStep,
} from "./pricing-step"
import {
  OrganizationStep,
} from "./organization-step"
import {
  StepFooter,
} from "./step-footer"
import {
  StepHeader,
} from "./step-header"
import type {
  FormationStatus,
  OnboardingFlowMode,
  IntentFocus,
  OnboardingSlugStatus,
  RoleInterest,
  Step,
} from "../types"

type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

type OnboardingDialogContentProps = {
  formRef: React.RefObject<HTMLFormElement | null>
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  step: number
  totalSteps: number
  attemptedStep: number | null
  errors: Record<string, string>
  serverError: string | null
  stepLabel: string
  currentStep: Step
  isInline: boolean
  intentFocus: IntentFocus | ""
  roleInterest: RoleInterest | ""
  formationStatus: FormationStatus | ""
  builderPlanTier: "free" | "organization" | "operations_support"
  accountStepReady: boolean
  orgNameValue: string
  orgSlugInputValue: string
  slugValue: string
  initialOrgName: string
  initialOrgSlug: string
  slugStatus: OnboardingSlugStatus
  slugHint: string | null
  initialFirstName: string
  initialLastName: string
  initialPhone: string
  initialPublicEmail: string
  initialTitle: string
  initialLinkedin: string
  initialOptInUpdates: boolean
  initialNewsletterOptIn: boolean
  accountValues: {
    firstName: string
    lastName: string
    phone: string
    publicEmail: string
    title: string
    linkedin: string
    optInUpdates: boolean
    newsletterOptIn: boolean
  }
  avatarPreview: string | null
  submitting: boolean
  progress: number
  cropOpen: boolean
  rawImageUrl: string | null
  crop: { x: number; y: number }
  zoom: number
  onFormChange: () => void
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onboardingMode: OnboardingFlowMode
  onPrev: () => void
  onNext: () => void
  onSelectIntent: (value: IntentFocus) => void
  onOrgNameChange: (value: string) => void
  onOrgSlugChange: (value: string) => string
  onFormationStatusSelect: (value: FormationStatus) => void
  onAvatarSelect: (file: File) => void
  onRemoveAvatar: () => void
  onCropOpenChange: (open: boolean) => void
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (area: CropArea) => void
  onApplyCrop: () => Promise<void>
  onSubmitAction: (form: FormData) => Promise<void>
}

export function OnboardingDialogContent({
  formRef,
  avatarInputRef,
  step,
  totalSteps,
  attemptedStep,
  errors,
  serverError,
  stepLabel,
  currentStep,
  isInline,
  intentFocus,
  roleInterest,
  formationStatus,
  builderPlanTier,
  accountStepReady,
  orgNameValue,
  orgSlugInputValue,
  slugValue,
  initialOrgName,
  initialOrgSlug,
  slugStatus,
  slugHint,
  initialFirstName,
  initialLastName,
  initialPhone,
  initialPublicEmail,
  initialTitle,
  initialLinkedin,
  initialOptInUpdates,
  initialNewsletterOptIn,
  accountValues,
  avatarPreview,
  submitting,
  progress,
  cropOpen,
  rawImageUrl,
  crop,
  zoom,
  onFormChange,
  onFormSubmit,
  onboardingMode,
  onPrev,
  onNext,
  onSelectIntent,
  onOrgNameChange,
  onOrgSlugChange,
  onFormationStatusSelect,
  onAvatarSelect,
  onRemoveAvatar,
  onCropOpenChange,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onApplyCrop,
  onSubmitAction,
}: OnboardingDialogContentProps) {
  return (
    <>
      <form
        ref={formRef}
        action={onSubmitAction}
        className="nodrag nopan relative flex h-full min-h-0 flex-1 flex-col space-y-0"
        onChange={onFormChange}
        onSubmit={onFormSubmit}
      >
        <input
          id="avatar"
          name="avatar"
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (!file) return
            onAvatarSelect(file)
          }}
        />
        <StepHeader
          stepLabel={stepLabel}
          currentStep={currentStep}
          isInline={isInline}
          progress={progress}
        />

        <div
          data-onboarding-scroll-region="true"
          className="nodrag nopan min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-0 md:px-6"
        >
          <div className="mx-auto w-full max-w-[640px] space-y-5 pb-5 md:space-y-6 md:pb-6">
            <input type="hidden" name="intentFocus" value={intentFocus} />
            <input type="hidden" name="onboardingMode" value={onboardingMode} />
            <input type="hidden" name="roleInterest" value={roleInterest} />
            <input type="hidden" name="formationStatus" value={formationStatus} />
            {currentStep.id !== "org" ? (
              <>
                <input type="hidden" name="orgName" value={orgNameValue} />
                <input
                  type="hidden"
                  name="orgSlug"
                  value={orgSlugInputValue || slugValue}
                />
              </>
            ) : null}
            {currentStep.id !== "account" ? (
              <>
                <input type="hidden" name="firstName" value={accountValues.firstName} />
                <input type="hidden" name="lastName" value={accountValues.lastName} />
                <input type="hidden" name="phone" value={accountValues.phone} />
                <input type="hidden" name="publicEmail" value={accountValues.publicEmail} />
                <input type="hidden" name="title" value={accountValues.title} />
                <input type="hidden" name="linkedin" value={accountValues.linkedin} />
                {accountValues.optInUpdates ? (
                  <input type="hidden" name="optInUpdates" value="on" />
                ) : null}
                {accountValues.newsletterOptIn ? (
                  <input type="hidden" name="newsletterOptIn" value="on" />
                ) : null}
              </>
            ) : null}

            {serverError ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mt-5 rounded-xl border px-4 py-3 text-sm">
                {serverError}
              </div>
            ) : null}

            {currentStep.id === "intent" ? (
              <IntentStep
                step={step}
                attemptedStep={attemptedStep}
                errors={errors}
                intentFocus={intentFocus}
                onSelectIntent={onSelectIntent}
              />
            ) : null}

            {currentStep.id === "org" ? (
              <OrganizationStep
                step={step}
                attemptedStep={attemptedStep}
                errors={errors}
                initialOrgName={initialOrgName}
                initialOrgSlug={initialOrgSlug}
                slugStatus={slugStatus}
                slugHint={slugHint}
                formationStatus={formationStatus}
                onOrgNameChange={onOrgNameChange}
                onOrgSlugChange={onOrgSlugChange}
                onFormationStatusSelect={onFormationStatusSelect}
              />
            ) : null}

            {currentStep.id === "pricing" ? (
              <PricingStep
                step={step}
                attemptedStep={attemptedStep}
                errors={errors}
                currentPlanTier={builderPlanTier}
                checkoutReturnTo="/onboarding?source=onboarding_pricing"
              />
            ) : null}

            {currentStep.id === "account" ? (
              <AccountStep
                step={step}
                attemptedStep={attemptedStep}
                errors={errors}
                avatarPreview={avatarPreview}
                avatarInputRef={avatarInputRef}
                submitting={submitting}
                initialFirstName={initialFirstName}
                initialLastName={initialLastName}
                initialPhone={initialPhone}
                initialPublicEmail={initialPublicEmail}
                initialTitle={initialTitle}
                initialLinkedin={initialLinkedin}
                initialOptInUpdates={initialOptInUpdates}
                initialNewsletterOptIn={initialNewsletterOptIn}
                onRemoveAvatar={onRemoveAvatar}
              />
            ) : null}

            {currentStep.id === "community" ? <CommunityStep /> : null}
          </div>
        </div>

        <StepFooter
          step={step}
          totalSteps={totalSteps}
          submitting={submitting}
          currentStepId={currentStep.id}
          intentFocus={intentFocus}
          slugStatus={slugStatus}
          formationStatus={formationStatus}
          accountStepReady={accountStepReady}
          builderPlanTier={builderPlanTier}
          onPrev={onPrev}
          onNext={onNext}
        />
      </form>

      <AvatarCropDialog
        open={cropOpen}
        rawImageUrl={rawImageUrl}
        crop={crop}
        zoom={zoom}
        onOpenChange={onCropOpenChange}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={onCropComplete}
        onApply={onApplyCrop}
      />
    </>
  )
}
