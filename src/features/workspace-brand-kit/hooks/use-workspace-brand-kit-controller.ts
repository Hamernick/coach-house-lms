"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type {
  BrandTypographyConfig,
  BrandTypographySlot,
  OrgProfile,
} from "@/lib/organization/org-profile-brand-types"

import {
  createBrandTypographyFromPreset,
  resolveBrandAccentPreset,
  resolveBrandKitReadiness,
  resolveBrandPalette,
  resolveBrandThemePreset,
  resolveBrandTypographyConfig,
  resolveBrandTypographyPreset,
  sanitizeBrandTypographyConfig,
  BRAND_KIT_ADDITIONAL_COLOR_LIMIT,
} from "../lib"
import type { WorkspaceBrandKitInput } from "../types"
import {
  normalizeHexColor,
  sanitizePalette,
} from "./workspace-brand-kit-controller-helpers"
import { useWorkspaceBrandKitPersistence } from "./use-workspace-brand-kit-persistence"

export function useWorkspaceBrandKitController({ profile }: WorkspaceBrandKitInput) {
  const [draftProfile, setDraftProfile] = useState<OrgProfile>(profile)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const draftProfileRef = useRef(draftProfile)

  useEffect(() => {
    setDraftProfile(profile)
  }, [profile])

  useEffect(() => {
    draftProfileRef.current = draftProfile
  }, [draftProfile])

  const updateDraft = useCallback((updates: Partial<OrgProfile>) => {
    setDraftProfile((current) => ({ ...current, ...updates }))
  }, [])

  const {
    isRefreshing,
    persistUpdates,
    persistField,
    handleAssetUpload,
  } = useWorkspaceBrandKitPersistence({
    draftProfileRef,
    setDraftProfile,
    setPendingKey,
  })

  const setPrimaryColor = useCallback(
    (value: string) => {
      updateDraft({ brandPrimary: normalizeHexColor(value) })
    },
    [updateDraft],
  )

  const savePrimaryColor = useCallback(
    async (value: string) => {
      const normalized = normalizeHexColor(value)
      return persistUpdates(
        { brandPrimary: normalized },
        { pendingKey: "brandPrimary" },
      )
    },
    [persistUpdates],
  )

  const setPaletteColor = useCallback(
    (index: number, value: string) => {
      const currentColors = Array.isArray(draftProfileRef.current.brandColors)
        ? [...draftProfileRef.current.brandColors]
        : []
      currentColors[index] = normalizeHexColor(value)
      updateDraft({ brandColors: currentColors })
    },
    [updateDraft],
  )

  const savePaletteColor = useCallback(
    async (index: number, value: string) => {
      const currentColors = Array.isArray(draftProfileRef.current.brandColors)
        ? [...draftProfileRef.current.brandColors]
        : []
      currentColors[index] = normalizeHexColor(value)
      return persistUpdates(
        {
          brandColors: sanitizePalette(currentColors, draftProfileRef.current.brandPrimary),
        },
        { pendingKey: "brandColors" },
      )
    },
    [persistUpdates],
  )

  const addPaletteColor = useCallback(async () => {
    const currentColors = Array.isArray(draftProfileRef.current.brandColors)
      ? [...draftProfileRef.current.brandColors]
      : []
    if (currentColors.length >= BRAND_KIT_ADDITIONAL_COLOR_LIMIT) return
    currentColors.push("#CBD5E1")
    await persistUpdates(
      {
        brandColors: sanitizePalette(currentColors, draftProfileRef.current.brandPrimary),
      },
      { pendingKey: "brandColors" },
    )
  }, [persistUpdates])

  const removePaletteColor = useCallback(
    async (index: number) => {
      const currentColors = Array.isArray(draftProfileRef.current.brandColors)
        ? draftProfileRef.current.brandColors.filter((_, currentIndex) => currentIndex !== index)
        : []
      await persistUpdates({ brandColors: currentColors }, { pendingKey: "brandColors" })
    },
    [persistUpdates],
  )

  const applyTypographyPreset = useCallback(
    async (presetId: string) => {
      const nextTypography = createBrandTypographyFromPreset(presetId)
      await persistUpdates(
        {
          brandTypographyPresetId: presetId,
          brandTypography: nextTypography,
        },
        { pendingKey: "brandTypographyPresetId" },
      )
    },
    [persistUpdates],
  )

  const applyThemePreset = useCallback(
    async (presetId: string) => {
      const preset = resolveBrandThemePreset(presetId)
      if (!preset) return false
      const nextTypography = createBrandTypographyFromPreset(preset.typographyPresetId)
      return persistUpdates(
        {
          brandThemePresetId: preset.id,
          brandAccentPresetId: preset.accentPresetId,
          brandPrimary: preset.primaryColor,
          brandColors: sanitizePalette(preset.supportingColors, preset.primaryColor),
          brandTypographyPresetId: preset.typographyPresetId,
          brandTypography: nextTypography,
        },
        { pendingKey: "brandThemePresetId" },
      )
    },
    [persistUpdates],
  )

  const applyAccentPreset = useCallback(
    async (presetId: string) => {
      const preset = resolveBrandAccentPreset(presetId)
      if (!preset) return false
      return persistUpdates(
        {
          brandAccentPresetId: preset.id,
          brandPrimary: preset.color,
        },
        { pendingKey: "brandAccentPresetId" },
      )
    },
    [persistUpdates],
  )

  const updateTypography = useCallback(
    (nextTypography: BrandTypographyConfig) => {
      updateDraft({
        brandTypography: sanitizeBrandTypographyConfig(
          nextTypography,
          draftProfileRef.current.brandTypographyPresetId,
        ),
      })
    },
    [updateDraft],
  )

  const saveTypography = useCallback(
    async (nextTypography: BrandTypographyConfig) => {
      return persistUpdates(
        {
          brandTypography: sanitizeBrandTypographyConfig(
            nextTypography,
            draftProfileRef.current.brandTypographyPresetId,
          ),
        },
        { pendingKey: "brandTypography" },
      )
    },
    [persistUpdates],
  )

  const updateTypographySlot = useCallback(
    (slot: "headings" | "body", updates: Partial<BrandTypographySlot>) => {
      const current = resolveBrandTypographyConfig(draftProfileRef.current)
      updateTypography({
        ...current,
        [slot]: {
          ...current[slot],
          ...updates,
        },
      })
    },
    [updateTypography],
  )

  const saveTypographySlot = useCallback(
    async (slot: "headings" | "body", updates: Partial<BrandTypographySlot>) => {
      const current = resolveBrandTypographyConfig(draftProfileRef.current)
      return saveTypography({
        ...current,
        [slot]: {
          ...current[slot],
          ...updates,
        },
      })
    },
    [saveTypography],
  )

  const saveCodeFont = useCallback(
    async (family: string) => {
      const current = resolveBrandTypographyConfig(draftProfileRef.current)
      return saveTypography({
        ...current,
        code: {
          family,
        },
      })
    },
    [saveTypography],
  )

  const readiness = useMemo(() => resolveBrandKitReadiness(draftProfile), [draftProfile])
  const palette = useMemo(() => resolveBrandPalette(draftProfile), [draftProfile])
  const typographyPreset = useMemo(
    () => resolveBrandTypographyPreset(draftProfile.brandTypographyPresetId),
    [draftProfile.brandTypographyPresetId],
  )
  const themePreset = useMemo(
    () => resolveBrandThemePreset(draftProfile.brandThemePresetId),
    [draftProfile.brandThemePresetId],
  )
  const accentPreset = useMemo(
    () => resolveBrandAccentPreset(draftProfile.brandAccentPresetId),
    [draftProfile.brandAccentPresetId],
  )
  const typographyConfig = useMemo(
    () => resolveBrandTypographyConfig(draftProfile),
    [draftProfile],
  )

  return {
    draftProfile,
    isSheetOpen,
    isRefreshing,
    pendingKey,
    palette,
    readiness,
    typographyPreset,
    themePreset,
    accentPreset,
    typographyConfig,
    setIsSheetOpen,
    updateDraft,
    persistUpdates,
    persistField,
    handleAssetUpload,
    setPrimaryColor,
    savePrimaryColor,
    setPaletteColor,
    savePaletteColor,
    addPaletteColor,
    removePaletteColor,
    applyTypographyPreset,
    applyThemePreset,
    applyAccentPreset,
    updateTypography,
    updateTypographySlot,
    saveTypography,
    saveTypographySlot,
    saveCodeFont,
  }
}

export type WorkspaceBrandKitController = ReturnType<typeof useWorkspaceBrandKitController>
