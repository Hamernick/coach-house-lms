"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

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

export function PublicPageSettings({ company, errors, onUpdate, onDirty, slugStatus, setSlugStatus }: CompanyEditProps) {
  const sharingEnabled = publicSharingEnabled
  const [isChecking, setIsChecking] = useState(false)
  const lastCheckRef = useRef(0)
  const explicitSlug = typeof company.publicSlug === "string" && company.publicSlug.trim().length > 0 ? company.publicSlug : ""
  const shouldCheckSlug = Boolean(explicitSlug || company.isPublic)
  const publicSlug = company.publicSlug || slugifyLocal(company.name || "")
  const slugCandidate = useMemo(() => {
    const raw = explicitSlug || (company.isPublic ? company.name || "" : "")
    return slugifyLocal(raw)
  }, [company.isPublic, company.name, explicitSlug])

  useEffect(() => {
    if (!sharingEnabled || !shouldCheckSlug) {
      setIsChecking(false)
      setSlugStatus(null)
      return
    }
    if (!slugCandidate) {
      setIsChecking(false)
      setSlugStatus({ available: false, message: "Enter a public URL", slug: "" })
      return
    }
    if (RESERVED_SLUGS.has(slugCandidate)) {
      setIsChecking(false)
      setSlugStatus({ available: false, message: "Reserved URL", slug: slugCandidate })
      return
    }

    const currentCheck = lastCheckRef.current + 1
    lastCheckRef.current = currentCheck
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsChecking(true)
      try {
        const res = await fetch(`/api/public/organizations/slug-available?slug=${encodeURIComponent(slugCandidate)}`, {
          signal: controller.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (lastCheckRef.current !== currentCheck) return
        if (typeof data.available === "boolean") {
          setSlugStatus({
            available: data.available,
            message: data.available ? "Available" : data.error || "Taken",
            slug: slugCandidate,
          })
        } else {
          setSlugStatus({ available: false, message: data.error || "Not available", slug: slugCandidate })
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setSlugStatus({ available: false, message: "Unable to check", slug: slugCandidate })
      } finally {
        if (lastCheckRef.current === currentCheck) {
          setIsChecking(false)
        }
      }
    }, 450)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [sharingEnabled, shouldCheckSlug, slugCandidate, setSlugStatus])

  const statusMessage = useMemo(() => {
    if (errors.publicSlug) return { tone: "error", message: errors.publicSlug }
    if (isChecking) return { tone: "muted", message: "Checking..." }
    if (!slugStatus?.message) return null
    return { tone: slugStatus.available ? "success" : "error", message: slugStatus.message }
  }, [errors.publicSlug, isChecking, slugStatus])

  return (
    <FormRow title="Public Page" description="Publish a minimal brand overview at a shareable URL.">
      <div className="grid gap-4">
        {!sharingEnabled ? (
          <p className="text-xs text-muted-foreground">
            Public pages are disabled until the site launches. You can still prepare your details.
          </p>
        ) : null}
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <Switch
            id="publicPageEnabled"
            checked={Boolean(company.isPublic)}
            disabled={!sharingEnabled}
            onCheckedChange={(value) => {
              onUpdate({ isPublic: Boolean(value) })
              onDirty()
            }}
            aria-label="Make brand overview public"
          />
          <div className="space-y-1">
            <Label htmlFor="publicPageEnabled" className="text-xs text-muted-foreground">
              Make public
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, your overview is available at /{publicSlug}
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="publicSlug">Public URL</Label>
              {statusMessage ? (
                <span
                  className={`text-xs ${
                    statusMessage.tone === "success"
                      ? "text-emerald-600 dark:text-emerald-500"
                      : statusMessage.tone === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {statusMessage.message}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <div className="relative w-full max-w-sm">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  /
                </span>
                <Input
                  id="publicSlug"
                  name="publicSlug"
                  value={company.publicSlug ?? ""}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    const normalized = slugifyLocal(value)
                    onUpdate({ publicSlug: normalized })
                    setSlugStatus(null)
                    onDirty()
                  }}
                  placeholder={slugifyLocal(company.name || "")}
                  aria-invalid={Boolean(errors.publicSlug)}
                  className="w-full min-w-0 pl-6"
                />
              </div>
            </div>
            {errors.publicSlug ? null : (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and dashes only. Avoid reserved words like /admin.
              </p>
            )}
          </div>
          {company.isPublic ? (
            <div className="flex flex-col items-stretch gap-2 lg:items-end lg:justify-self-end">
              <Button asChild size="sm" variant="secondary" className="w-full lg:w-auto">
                <Link href={`/${publicSlug}`}>View public page</Link>
              </Button>
              <ShareButton
                url={
                  typeof window === "undefined" ? undefined : `${window.location.origin}/${publicSlug}`
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
