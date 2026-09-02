"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

type PublicAffiliationSetting = {
  organizationId: string
  name: string
  logoUrl: string | null
  publicSlug: string | null
  organizationIsPublic: boolean
  role: "owner" | "admin" | "staff" | "board" | "member"
  visible: boolean
}

const ROLE_LABELS: Record<PublicAffiliationSetting["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  board: "Board",
  member: "Member",
}

function organizationInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return `${words[0]?.[0] ?? "C"}${words.at(-1)?.[0] ?? "H"}`.toUpperCase()
}

export function PublicProfileAffiliationSettings({
  idPrefix,
}: {
  idPrefix: string
}) {
  const [affiliations, setAffiliations] = useState<PublicAffiliationSetting[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())

  const loadAffiliations = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/account/public-affiliations")
      const result = (await response.json()) as {
        affiliations?: PublicAffiliationSetting[]
        error?: string
      }
      if (!response.ok || !result.affiliations) {
        throw new Error(result.error ?? "Unable to load organizations.")
      }
      setAffiliations(result.affiliations)
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load organizations."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAffiliations()
  }, [loadAffiliations])

  async function updateVisibility(organizationId: string, visible: boolean) {
    setAffiliations((current) =>
      current.map((affiliation) =>
        affiliation.organizationId === organizationId
          ? { ...affiliation, visible }
          : affiliation
      )
    )
    setPendingIds((current) => new Set(current).add(organizationId))

    try {
      const response = await fetch("/api/account/public-affiliations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, visible }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update this organization.")
      }
      toast.success(
        visible
          ? "Organization added to your public profile."
          : "Organization removed from your public profile."
      )
    } catch (error) {
      setAffiliations((current) =>
        current.map((affiliation) =>
          affiliation.organizationId === organizationId
            ? { ...affiliation, visible: !visible }
            : affiliation
        )
      )
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update this organization."
      )
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(organizationId)
        return next
      })
    }
  }

  return (
    <section aria-labelledby={`${idPrefix}-heading`} className="space-y-4">
      <div className="space-y-1">
        <h3 id={`${idPrefix}-heading`} className="text-sm font-medium">
          Organizations
        </h3>
        <p className="text-muted-foreground text-sm leading-6">
          Choose verified memberships to show. Private organizations remain
          hidden until the organization publishes.
        </p>
      </div>

      {loading ? (
        <div
          aria-label="Loading organization memberships"
          className="space-y-2"
        >
          {[0, 1].map((item) => (
            <div
              key={item}
              className="flex min-h-16 items-center gap-3 rounded-xl border p-3"
            >
              <Skeleton className="size-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-36 max-w-full" />
                <Skeleton className="h-3 w-24 max-w-full" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 space-y-3 rounded-xl border p-4"
        >
          <p className="text-destructive text-sm">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadAffiliations}
          >
            Try again
          </Button>
        </div>
      ) : affiliations.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm leading-6">
          No verified memberships yet. Join an organization to make it eligible
          for your public profile.
        </p>
      ) : (
        <div className="space-y-2">
          {affiliations.map((affiliation) => {
            const switchId = `${idPrefix}-${affiliation.organizationId}`
            const pending = pendingIds.has(affiliation.organizationId)
            return (
              <div
                key={affiliation.organizationId}
                className="flex min-h-16 items-center gap-3 rounded-xl border p-3"
              >
                <Label
                  htmlFor={switchId}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                >
                  <Avatar className="size-9 border">
                    <AvatarImage
                      src={affiliation.logoUrl ?? undefined}
                      alt=""
                    />
                    <AvatarFallback className="text-xs">
                      {organizationInitials(affiliation.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 space-y-0.5">
                    <span className="block truncate text-sm font-medium">
                      {affiliation.name}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {affiliation.organizationIsPublic
                        ? "Eligible for public display"
                        : "Hidden until the organization publishes"}
                    </span>
                  </span>
                </Label>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {ROLE_LABELS[affiliation.role]}
                </Badge>
                <Switch
                  id={switchId}
                  checked={affiliation.visible}
                  disabled={pending}
                  aria-label={`Show ${affiliation.name} on your public profile`}
                  onCheckedChange={(checked) =>
                    void updateVisibility(affiliation.organizationId, checked)
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
