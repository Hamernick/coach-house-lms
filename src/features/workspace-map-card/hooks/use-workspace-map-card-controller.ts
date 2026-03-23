"use client"

import { useEffect, useMemo, useState } from "react"

import {
  buildWorkspaceMapLocationLabel,
  buildWorkspaceMapStaticPreviewUrl,
  normalizeWorkspaceMapCardInput,
  resolveWorkspaceMapChecklist,
  resolveWorkspaceMapCompletionSummary,
  resolveWorkspaceMapOrganizationLocation,
} from "../lib"
import type { WorkspaceMapCardInput, WorkspaceMapResolvedLocation } from "../types"

export function useWorkspaceMapCardController({
  input,
  previewWidth,
  previewHeight,
}: {
  input: WorkspaceMapCardInput
  previewWidth: number
  previewHeight: number
}) {
  const normalizedInput = useMemo(
    () => normalizeWorkspaceMapCardInput(input),
    [input],
  )
  const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
  const tokenAvailable = token.length > 0
  const [resolvedLocation, setResolvedLocation] =
    useState<WorkspaceMapResolvedLocation | null>(null)
  const [locationResolved, setLocationResolved] = useState(false)

  useEffect(() => {
    if (!tokenAvailable) {
      setResolvedLocation(null)
      setLocationResolved(true)
      return
    }

    let cancelled = false
    setLocationResolved(false)

    void resolveWorkspaceMapOrganizationLocation({
      orgId: normalizedInput.orgId,
      profile: normalizedInput.profile,
      fallbackTitle: normalizedInput.title,
      token,
    }).then((location) => {
      if (cancelled) return
      setResolvedLocation(location)
      setLocationResolved(true)
    })

    return () => {
      cancelled = true
    }
  }, [
    normalizedInput.orgId,
    normalizedInput.profile,
    normalizedInput.title,
    token,
    tokenAvailable,
  ])

  const checklistItems = useMemo(
    () =>
      resolveWorkspaceMapChecklist({
        companyHref: normalizedInput.companyHref,
        profile: normalizedInput.profile,
      }),
    [normalizedInput.companyHref, normalizedInput.profile],
  )

  const completionSummary = useMemo(
    () => resolveWorkspaceMapCompletionSummary(checklistItems),
    [checklistItems],
  )

  const previewUrl = useMemo(
    () =>
      tokenAvailable
        ? buildWorkspaceMapStaticPreviewUrl({
            token,
            location: resolvedLocation,
            width: previewWidth,
            height: previewHeight,
          })
        : null,
    [previewHeight, previewWidth, resolvedLocation, token, tokenAvailable],
  )

  const locationLabel = useMemo(
    () =>
      buildWorkspaceMapLocationLabel(
        normalizedInput.profile,
        normalizedInput.title,
      ),
    [normalizedInput.profile, normalizedInput.title],
  )

  return {
    input: normalizedInput,
    token,
    tokenAvailable,
    resolvedLocation,
    locationLabel,
    locationResolved,
    previewUrl,
    checklistItems,
    completionSummary,
    disableChecklistLinks: normalizedInput.tutorialStepId === "map-card",
  }
}
