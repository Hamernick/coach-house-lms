"use client"

import * as React from "react"

import {
  AccountStep,
} from "./account-step"
import {
  AvatarCropDialog,
} from "./avatar-crop-dialog"
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
  avatarPreview: string | null
  submitting: boolean
  progress: number
  cropOpen: boolean
  rawImageUrl: string | null
  crop: { x: number; y: number }
  zoom: number
  onFormChange: () => void
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onPrev: () => void
  onNext: () => void
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
  avatarPreview,
  submitting,
  progress,
  cropOpen,
  rawImageUrl,
  crop,
  zoom,
  onFormChange,
  onFormSubmit,
  onPrev,
  onNext,
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
        className="relative flex min-h-0 flex-1 flex-col space-y-0"
        onChange={onFormChange}
        onSubmit={onFormSubmit}
      >
        <StepHeader
          stepLabel={stepLabel}
          currentStep={currentStep}
          isInline={isInline}
          progress={progress}
        />

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-0 md:px-6">
          <input type="hidden" name="intentFocus" value={intentFocus} />
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

          {serverError ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mt-5 rounded-xl border px-4 py-3 text-sm">
              {serverError}
            </div>
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
              onAvatarSelect={onAvatarSelect}
              onRemoveAvatar={onRemoveAvatar}
            />
          ) : null}
        </div>

        <StepFooter
          step={step}
          totalSteps={totalSteps}
          submitting={submitting}
          currentStepId={currentStep.id}
          slugStatus={slugStatus}
          formationStatus={formationStatus}
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
