"use client"

import * as React from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { toast } from "@/lib/toast"
import { savePublicPersonProfileAction } from "@/actions/public-profile-actions"
import { normalizePublicHandle } from "../lib"
import type { PublicHandleResult } from "../types"
import { usePublicHandleAvailability } from "../hooks/use-public-handle-availability"

type PublicProfileIdentitySettingsProps = {
  avatarUrl: string | null
  displayName: string
  headline: string
  idPrefix: string
  isUploadingAvatar: boolean
  onAvatarFileSelected: (file?: File | null) => void
  profileDetails: ReactNode
}

type PersonHandleRow = {
  handle: string
}

type PersonPublicProfileRow = {
  display_name: string
  headline: string | null
  bio: string | null
  location_label: string | null
  website_url: string | null
  avatar_url: string | null
  is_public: boolean
  show_organizations: boolean
  show_program_activity: boolean
  show_saved_locations: boolean
}

function initialsFor(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "CH"
  return `${parts[0]?.charAt(0) ?? ""}${parts.at(-1)?.charAt(0) ?? ""}`.toUpperCase()
}

function ProfileIdentityPreview({
  avatarUrl,
  currentHandle,
  displayName,
  headline,
  idPrefix,
  isLoading,
  isPublic,
  isUploadingAvatar,
  normalizedHandle,
  onAvatarFileSelected,
}: {
  avatarUrl: string | null
  currentHandle: string
  displayName: string
  headline: string
  idPrefix: string
  isLoading: boolean
  isPublic: boolean
  isUploadingAvatar: boolean
  normalizedHandle: string
  onAvatarFileSelected: (file?: File | null) => void
}) {
  const avatarInputRef = React.useRef<HTMLInputElement>(null)
  const profileStatus = isLoading
    ? "Loading"
    : isPublic
      ? "Published"
      : "Private"

  return (
    <header className="flex flex-col items-center text-center">
      <div className="relative" aria-busy={isUploadingAvatar}>
        <Avatar className="bg-muted size-24 border sm:size-28">
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="text-xl">
            {initialsFor(displayName)}
          </AvatarFallback>
        </Avatar>
        {isUploadingAvatar ? (
          <span className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full">
            <Loader2Icon className="size-6 animate-spin" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <Badge variant="outline" className="mt-5">
        {profileStatus}
      </Badge>
      <h3 className="mt-4 max-w-full text-2xl font-medium tracking-tight text-balance break-words sm:text-3xl">
        {displayName}
      </h3>
      <p className="text-muted-foreground mt-1 max-w-full text-sm break-all">
        {normalizedHandle ? `@${normalizedHandle}` : "@your-name"}
      </p>
      {headline.trim() ? (
        <p className="text-foreground/80 mt-3 max-w-xl text-sm leading-6 text-pretty sm:text-base">
          {headline.trim()}
        </p>
      ) : null}
      <input
        ref={avatarInputRef}
        id={`${idPrefix}-avatar-upload`}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={isUploadingAvatar}
        onChange={(event) => {
          onAvatarFileSelected(event.currentTarget.files?.[0] ?? null)
          event.currentTarget.value = ""
        }}
      />
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-11 sm:h-8"
          disabled={isUploadingAvatar}
          onClick={() => avatarInputRef.current?.click()}
        >
          {isUploadingAvatar ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : null}
          Change photo
        </Button>
        {isPublic && currentHandle ? (
          <Button asChild size="sm" variant="outline" className="h-11 sm:h-8">
            <Link href={`/${currentHandle}`}>View profile</Link>
          </Button>
        ) : null}
      </div>
    </header>
  )
}

export function PublicProfileIdentitySettings({
  avatarUrl,
  displayName,
  headline,
  idPrefix,
  isUploadingAvatar,
  onAvatarFileSelected,
  profileDetails,
}: PublicProfileIdentitySettingsProps) {
  const supabase = useSupabaseClient()
  const [currentHandle, setCurrentHandle] = React.useState("")
  const [handleValue, setHandleValue] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [savingVisibility, setSavingVisibility] = React.useState(false)
  const [isPublic, setIsPublic] = React.useState(false)
  const [savedIsPublic, setSavedIsPublic] = React.useState(false)
  const [publicProfile, setPublicProfile] =
    React.useState<PersonPublicProfileRow | null>(null)
  const { status, hint } = usePublicHandleAvailability({
    open: !loading,
    handleValue,
    currentHandle,
  })

  React.useEffect(() => {
    let mounted = true

    async function loadPublicIdentity() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) setLoading(false)
        return
      }

      const [{ data: handleData }, { data: profileData }] = await Promise.all([
        supabase
          .from("public_handles")
          .select("handle")
          .eq("owner_type", "person")
          .eq("profile_id", user.id)
          .maybeSingle<PersonHandleRow>(),
        supabase
          .from("public_person_profiles")
          .select(
            "display_name, headline, bio, location_label, website_url, avatar_url, is_public, show_organizations, show_program_activity, show_saved_locations"
          )
          .eq("profile_id", user.id)
          .maybeSingle<PersonPublicProfileRow>(),
      ])

      if (!mounted) return
      const handle = handleData?.handle ?? ""
      setCurrentHandle(handle)
      setHandleValue(handle)
      setPublicProfile(profileData ?? null)
      setIsPublic(profileData?.is_public ?? false)
      setSavedIsPublic(profileData?.is_public ?? false)
      setLoading(false)
    }

    void loadPublicIdentity()
    return () => {
      mounted = false
    }
  }, [supabase])

  const normalizedHandle = normalizePublicHandle(handleValue)
  const unchanged = normalizedHandle === currentHandle
  const statusText =
    status === "checking"
      ? "Checking…"
      : status === "available"
        ? unchanged
          ? "Current"
          : "Available"
        : null
  const describedBy = [
    `${idPrefix}-username-hint`,
    statusText ? `${idPrefix}-username-status` : null,
  ]
    .filter(Boolean)
    .join(" ")

  async function saveHandle() {
    if (status !== "available" || unchanged) return
    setSaving(true)
    try {
      const response = await fetch("/api/account/public-handle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: normalizedHandle }),
      })
      const result = (await response.json()) as PublicHandleResult
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setCurrentHandle(result.handle)
      setHandleValue(result.handle)
      toast.success("Username updated.")
    } catch {
      toast.error("Unable to update username.")
    } finally {
      setSaving(false)
    }
  }

  async function saveVisibility(nextIsPublic: boolean) {
    if (!currentHandle || nextIsPublic === savedIsPublic) return
    setIsPublic(nextIsPublic)
    setSavingVisibility(true)
    try {
      const result = await savePublicPersonProfileAction({
        displayName:
          displayName.trim() || publicProfile?.display_name || currentHandle,
        headline: headline.trim() || publicProfile?.headline || null,
        bio: publicProfile?.bio ?? null,
        locationLabel: publicProfile?.location_label ?? null,
        websiteUrl: publicProfile?.website_url ?? null,
        avatarUrl: avatarUrl ?? publicProfile?.avatar_url ?? null,
        isPublic: nextIsPublic,
        showOrganizations: publicProfile?.show_organizations ?? true,
        showProgramActivity: publicProfile?.show_program_activity ?? true,
        showSavedLocations: publicProfile?.show_saved_locations ?? false,
      })
      if (!result.ok) {
        toast.error(result.error)
        setIsPublic(savedIsPublic)
        return
      }

      setSavedIsPublic(nextIsPublic)
      setPublicProfile((current) =>
        current
          ? { ...current, is_public: nextIsPublic }
          : {
              display_name: resolvedDisplayName,
              headline: headline.trim() || null,
              bio: null,
              location_label: null,
              website_url: null,
              avatar_url: avatarUrl,
              is_public: nextIsPublic,
              show_organizations: true,
              show_program_activity: true,
              show_saved_locations: false,
            }
      )
      toast.success(
        nextIsPublic ? "Profile published." : "Profile unpublished."
      )
    } catch {
      setIsPublic(savedIsPublic)
      toast.error("Unable to update profile visibility.")
    } finally {
      setSavingVisibility(false)
    }
  }

  const resolvedDisplayName = displayName.trim() || "Your profile"
  return (
    <section
      aria-label="Profile identity and publication"
      className="space-y-10"
    >
      <ProfileIdentityPreview
        avatarUrl={avatarUrl}
        currentHandle={currentHandle}
        displayName={resolvedDisplayName}
        headline={headline}
        idPrefix={idPrefix}
        isLoading={loading}
        isPublic={savedIsPublic}
        isUploadingAvatar={isUploadingAvatar}
        normalizedHandle={normalizedHandle}
        onAvatarFileSelected={onAvatarFileSelected}
      />

      <Separator />

      {profileDetails}

      <Separator />

      <section
        aria-labelledby={`${idPrefix}-public-page-heading`}
        className="space-y-6"
      >
        <div className="space-y-1">
          <h3
            id={`${idPrefix}-public-page-heading`}
            className="text-lg font-medium tracking-tight"
          >
            Public page
          </h3>
          <p className="text-muted-foreground max-w-xl text-sm leading-6 text-pretty">
            Choose your Coach House address and decide when people can view it.
          </p>
        </div>
        <Field
          data-invalid={status === "unavailable" || undefined}
          data-disabled={loading || saving || undefined}
          className="gap-2"
        >
          <FieldLabel htmlFor={`${idPrefix}-username`}>Username</FieldLabel>
          <FieldControl className="col-span-1">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <InputGroup className="min-w-0 flex-wrap items-center">
                <InputGroupText>coachhouse.app/</InputGroupText>
                <InputGroupInput
                  id={`${idPrefix}-username`}
                  name="username"
                  value={handleValue}
                  autoCapitalize="none"
                  autoComplete="username"
                  spellCheck={false}
                  disabled={loading || saving}
                  placeholder={loading ? "Loading…" : "your-name"}
                  className="min-w-36 text-base sm:text-sm"
                  aria-invalid={status === "unavailable"}
                  aria-describedby={describedBy}
                  onChange={(event) => {
                    setHandleValue(
                      normalizePublicHandle(event.currentTarget.value)
                    )
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    void saveHandle()
                  }}
                />
                {statusText ? (
                  <Badge
                    id={`${idPrefix}-username-status`}
                    variant="outline"
                    role="status"
                    aria-live="polite"
                  >
                    {statusText}
                  </Badge>
                ) : null}
              </InputGroup>
              <Button
                type="button"
                size="sm"
                className="h-11 sm:h-9"
                disabled={
                  loading || saving || unchanged || status !== "available"
                }
                aria-busy={saving}
                onClick={() => void saveHandle()}
              >
                {saving ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                {currentHandle ? "Update username" : "Claim username"}
              </Button>
            </div>
          </FieldControl>
          {status === "unavailable" ? (
            <FieldMessage id={`${idPrefix}-username-hint`}>
              {hint ?? "That username is not available."}
            </FieldMessage>
          ) : (
            <FieldDescription id={`${idPrefix}-username-hint`}>
              {hint ??
                "Use 2–48 lowercase letters, numbers, or single hyphens."}
            </FieldDescription>
          )}
        </Field>
        <div className="flex min-h-16 items-center justify-between gap-4 border-t pt-5">
          <Label
            htmlFor={`${idPrefix}-visibility`}
            className="min-w-0 cursor-pointer space-y-1 py-2"
          >
            <span className="block text-sm font-medium">Visibility</span>
            <span className="text-muted-foreground block text-xs leading-5 font-normal">
              {currentHandle ? (
                <>
                  {isPublic ? "Published" : "Private"} at coachhouse.app/
                  <span className="break-all">{currentHandle}</span>
                </>
              ) : (
                "Claim a username before publishing."
              )}
            </span>
          </Label>
          <div className="flex shrink-0 items-center gap-2">
            {savingVisibility ? (
              <Loader2Icon
                className="text-muted-foreground size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            <Switch
              id={`${idPrefix}-visibility`}
              checked={isPublic}
              disabled={loading || savingVisibility || !currentHandle}
              aria-label="Publish profile"
              aria-busy={savingVisibility}
              onCheckedChange={(checked) => void saveVisibility(checked)}
            />
          </div>
        </div>
      </section>
    </section>
  )
}
