"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShareButton } from "@/components/shared/share-button"

import { FormRow } from "@/components/organization/org-profile-card/shared"
import { slugifyLocal } from "../../../utils"
import type { CompanyEditProps } from "../types"
import { RESERVED_SLUGS } from "../constants"
import { Switch } from "@/components/ui/switch"
import { publicSharingEnabled } from "@/lib/feature-flags"

export function PublicPageSettings({ company, onUpdate, onDirty, slugStatus, setSlugStatus }: CompanyEditProps) {
  const sharingEnabled = publicSharingEnabled

  return (
    <FormRow title="Public Page" description="Publish a minimal brand overview at a shareable URL.">
      <div className="grid gap-4">
        {!sharingEnabled ? (
          <p className="text-xs text-muted-foreground">
            Public pages are disabled until the site launches. You can still prepare your details.
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Make public</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, your overview is available at /{company.publicSlug || slugifyLocal(company.name || "")}
            </p>
          </div>
          <Switch
            checked={Boolean(company.isPublic)}
            disabled={!sharingEnabled}
            onCheckedChange={(value) => {
              onUpdate({ isPublic: Boolean(value) })
              onDirty()
            }}
            aria-label="Make brand overview public"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-1">
            <Label htmlFor="publicSlug">Public URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="publicSlug"
                name="publicSlug"
                value={company.publicSlug ?? ""}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  const normalized = slugifyLocal(value)
                  onUpdate({ publicSlug: normalized })
                  if (!normalized) {
                    setSlugStatus(null)
                  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
                    setSlugStatus({ available: false, message: "Invalid format" })
                  } else if (RESERVED_SLUGS.has(normalized)) {
                    setSlugStatus({ available: false, message: "Reserved URL" })
                  } else {
                    setSlugStatus(null)
                  }
                  onDirty()
                }}
                placeholder={slugifyLocal(company.name || "")}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const raw = company.publicSlug || slugifyLocal(company.name || "")
                  if (!raw) return
                  const res = await fetch(`/api/public/organizations/slug-available?slug=${encodeURIComponent(raw)}`)
                  const data = await res.json().catch(() => ({}))
                  if (typeof data.available === "boolean") {
                    setSlugStatus({ available: data.available, message: data.available ? "Available" : "Taken" })
                  } else {
                    setSlugStatus({ available: false, message: data.error || "Not available" })
                  }
                }}
              >
                Check availability
              </Button>
            </div>
            {slugStatus ? (
              <p className={`text-xs ${slugStatus.available ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}`}>
                {slugStatus.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and dashes only. Avoid reserved words like /admin.
              </p>
            )}
          </div>
          {company.isPublic ? (
            <div className="flex items-center gap-2 sm:justify-self-end">
              <Button asChild size="sm" variant="secondary">
                <Link href={`/${company.publicSlug || slugifyLocal(company.name || "")}`}>View public page</Link>
              </Button>
              <ShareButton
                url={
                  typeof window === "undefined"
                    ? undefined
                    : `${window.location.origin}/${company.publicSlug || slugifyLocal(company.name || "")}`
                }
                title={company.name || company.publicSlug || "Organization"}
              />
            </div>
          ) : null}
        </div>
      </div>
    </FormRow>
  )
}
