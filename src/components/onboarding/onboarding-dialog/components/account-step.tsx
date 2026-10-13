"use client"

import type { RefObject } from "react"
import Image from "next/image"
import CameraIcon from "lucide-react/dist/esm/icons/camera"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AccountStepProps = {
  step: number
  attemptedStep: number | null
  errors: Record<string, string>
  avatarPreview: string | null
  avatarInputRef: RefObject<HTMLInputElement | null>
  submitting: boolean
  initialFirstName: string
  initialLastName: string
  initialPhone: string
  initialPublicEmail: string
  initialTitle: string
  initialLinkedin: string
  initialOptInUpdates: boolean
  initialNewsletterOptIn: boolean
  onRemoveAvatar: () => void
}

export function AccountStep({
  step,
  attemptedStep,
  errors,
  avatarPreview,
  avatarInputRef,
  submitting,
  initialFirstName,
  initialLastName,
  initialPhone,
  initialPublicEmail,
  initialTitle,
  initialLinkedin,
  initialOptInUpdates,
  initialNewsletterOptIn,
  onRemoveAvatar,
}: AccountStepProps) {
  return (
    <div className="space-y-5 py-5" data-onboarding-step-id="account">
      <div className="border-border/70 bg-background/60 flex min-h-[10.5rem] flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-6">
        <div className="relative size-16">
          <div className="border-border bg-card h-full w-full overflow-hidden rounded-full border">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm font-semibold">
                CH
              </div>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-1 -bottom-1 z-10 h-7 w-7 rounded-full"
            aria-label={
              avatarPreview ? "Change profile photo" : "Upload profile photo"
            }
            onClick={() => avatarInputRef.current?.click()}
          >
            <CameraIcon className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
        <div className="text-muted-foreground text-xs">
          Upload a profile picture (optional)
        </div>
        {avatarPreview ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={submitting}
            onClick={onRemoveAvatar}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4" aria-hidden />
            Remove photo
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            data-onboarding-primary-focus="true"
            defaultValue={initialFirstName}
            aria-invalid={attemptedStep === step && Boolean(errors.firstName)}
          />
          {attemptedStep === step && errors.firstName ? (
            <p className="text-destructive text-xs">{errors.firstName}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={initialLastName}
            aria-invalid={attemptedStep === step && Boolean(errors.lastName)}
          />
          {attemptedStep === step && errors.lastName ? (
            <p className="text-destructive text-xs">{errors.lastName}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="(555) 555-5555"
          defaultValue={initialPhone}
        />
        <p className="text-muted-foreground min-h-8 text-xs leading-4">
          Optional.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="publicEmail">
            Public contact email{" "}
            <span className="text-muted-foreground">(public)</span>
          </Label>
          <Input
            id="publicEmail"
            name="publicEmail"
            type="email"
            placeholder="contact@yourorg.org"
            defaultValue={initialPublicEmail}
          />
          <p className="text-muted-foreground text-xs">
            Shown on your workspace/profile for collaborators.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            id="title"
            name="title"
            placeholder="Founder, Executive Director, etc."
            defaultValue={initialTitle}
          />
          <p className="invisible text-xs">Optional.</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="linkedin">LinkedIn (optional)</Label>
        <Input
          id="linkedin"
          name="linkedin"
          placeholder="https://linkedin.com/in/…"
          defaultValue={initialLinkedin}
        />
      </div>

      <div className="border-border/70 bg-background/60 space-y-3 rounded-2xl border p-4">
        <div className="flex items-start gap-3 text-sm">
          <Checkbox
            id="optInUpdates"
            name="optInUpdates"
            defaultChecked={initialOptInUpdates}
            className="mt-1"
          />
          <Label htmlFor="optInUpdates" className="space-y-0.5 text-sm">
            <span className="text-foreground block font-medium">
              Product updates
            </span>
            <span className="text-muted-foreground block text-xs">
              Tips, release notes, and announcements.
            </span>
          </Label>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Checkbox
            id="newsletterOptIn"
            name="newsletterOptIn"
            defaultChecked={initialNewsletterOptIn}
            className="mt-1"
          />
          <Label htmlFor="newsletterOptIn" className="space-y-0.5 text-sm">
            <span className="text-foreground block font-medium">
              Newsletter
            </span>
            <span className="text-muted-foreground block text-xs">
              Curated learning resources and community updates.
            </span>
          </Label>
        </div>
      </div>
    </div>
  )
}
