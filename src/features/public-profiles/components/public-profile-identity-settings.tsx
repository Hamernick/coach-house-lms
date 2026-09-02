"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

export function PublicProfileIdentitySettings({
  avatarUrl,
  displayName,
  headline,
  idPrefix,
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

  async function saveVisibility() {
    if (!currentHandle || isPublic === savedIsPublic) return
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
        isPublic,
        showOrganizations: publicProfile?.show_organizations ?? true,
        showProgramActivity: publicProfile?.show_program_activity ?? true,
        showSavedLocations: publicProfile?.show_saved_locations ?? false,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setSavedIsPublic(isPublic)
      setPublicProfile((current) =>
        current
          ? { ...current, is_public: isPublic }
          : {
              display_name: resolvedDisplayName,
              headline: headline.trim() || null,
              bio: null,
              location_label: null,
              website_url: null,
              avatar_url: avatarUrl,
              is_public: isPublic,
              show_organizations: true,
              show_program_activity: true,
              show_saved_locations: false,
            }
      )
      toast.success(isPublic ? "Profile published." : "Profile unpublished.")
    } catch {
      toast.error("Unable to update profile visibility.")
    } finally {
      setSavingVisibility(false)
    }
  }

  const resolvedDisplayName = displayName.trim() || "Your profile"

  return (
    <section className="border-border/70 flex flex-col gap-5 rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-medium">Public profile</h4>
          <Badge variant={savedIsPublic ? "default" : "secondary"}>
            {savedIsPublic ? "Published" : "Private"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Reserve your profile URL now. Nothing becomes public until you
          publish.
        </p>
      </div>

      <Field
        data-invalid={status === "unavailable" || undefined}
        data-disabled={loading || saving || undefined}
        className="gap-2"
      >
        <FieldLabel htmlFor={`${idPrefix}-username`}>Username</FieldLabel>
        <FieldControl className="col-span-1">
          <InputGroup className="min-w-0 flex-wrap items-center">
            <InputGroupText>coachhouse.app/</InputGroupText>
            <InputGroupInput
              id={`${idPrefix}-username`}
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
                setHandleValue(normalizePublicHandle(event.currentTarget.value))
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
        </FieldControl>
        {status === "unavailable" ? (
          <FieldMessage id={`${idPrefix}-username-hint`}>
            {hint ?? "That username is not available."}
          </FieldMessage>
        ) : (
          <FieldDescription id={`${idPrefix}-username-hint`}>
            {hint ?? "Use 2–48 lowercase letters, numbers, or single hyphens."}
          </FieldDescription>
        )}
        <div>
          <Button
            type="button"
            size="sm"
            disabled={loading || saving || unchanged || status !== "available"}
            onClick={() => void saveHandle()}
          >
            {saving
              ? "Saving…"
              : currentHandle
                ? "Update username"
                : "Claim username"}
          </Button>
        </div>
      </Field>

      <div className="border-border/70 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <label
            htmlFor={`${idPrefix}-visibility`}
            className="text-sm font-medium"
          >
            Publish profile
          </label>
          <p className="text-muted-foreground max-w-md text-sm">
            Public profiles can be viewed at coachhouse.app/
            {currentHandle || "your-name"}. Turn this off anytime to remove the
            page.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Switch
            id={`${idPrefix}-visibility`}
            checked={isPublic}
            disabled={loading || savingVisibility || !currentHandle}
            aria-label="Publish public profile"
            onCheckedChange={setIsPublic}
          />
          <Button
            type="button"
            size="sm"
            variant={isPublic ? "default" : "outline"}
            disabled={
              loading ||
              savingVisibility ||
              !currentHandle ||
              isPublic === savedIsPublic
            }
            onClick={() => void saveVisibility()}
          >
            {savingVisibility ? "Saving…" : isPublic ? "Publish" : "Unpublish"}
          </Button>
        </div>
      </div>

      <Card className="bg-muted/35 mx-auto w-full max-w-md">
        <CardContent className="flex flex-col items-center px-5 py-6 text-center">
          <Avatar className="size-16 border">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{initialsFor(resolvedDisplayName)}</AvatarFallback>
          </Avatar>
          <p className="mt-3 font-medium">{resolvedDisplayName}</p>
          <p className="text-muted-foreground text-sm">
            {normalizedHandle ? `@${normalizedHandle}` : "@your-name"}
          </p>
          {headline.trim() ? (
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              {headline.trim()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
