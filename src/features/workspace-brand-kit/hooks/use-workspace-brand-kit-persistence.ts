"use client"

import {
  useCallback,
  useTransition,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react"
import { useRouter } from "next/navigation"

import { updateOrganizationProfileAction } from "@/actions/organization"
import type {
  BrandTypographyConfig,
  OrgProfile,
} from "@/lib/organization/org-profile-brand-types"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import { toast } from "@/lib/toast"

import { sanitizeBrandTypographyConfig } from "../lib"
import {
  isValidHexColor,
  normalizeHexColor,
  sanitizePalette,
} from "./workspace-brand-kit-controller-helpers"

export function useWorkspaceBrandKitPersistence({
  draftProfileRef,
  setDraftProfile,
  setPendingKey,
}: {
  draftProfileRef: MutableRefObject<OrgProfile>
  setDraftProfile: Dispatch<SetStateAction<OrgProfile>>
  setPendingKey: Dispatch<SetStateAction<string | null>>
}) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()

  const persistUpdates = useCallback(
    async (
      updates: Partial<OrgProfile>,
      options?: {
        pendingKey?: string
        successMessage?: string
        errorMessage?: string
      },
    ) => {
      const previous = draftProfileRef.current
      const rollback: Partial<OrgProfile> = {}
      const mutableRollback = rollback as Record<keyof OrgProfile, OrgProfile[keyof OrgProfile] | undefined>
      for (const key of Object.keys(updates) as Array<keyof OrgProfile>) {
        mutableRollback[key] = previous[key]
      }

      setDraftProfile((current) => ({ ...current, ...updates }))
      if (options?.pendingKey) setPendingKey(options.pendingKey)

      const result = await updateOrganizationProfileAction(updates)
      const error = (result as { error?: string })?.error
      if (error) {
        setDraftProfile((current) => ({ ...current, ...rollback }))
        toast.error(options?.errorMessage ?? error)
        setPendingKey(null)
        return false
      }

      if (options?.successMessage) {
        toast.success(options.successMessage)
      }
      startRefreshTransition(() => {
        router.refresh()
      })
      setPendingKey(null)
      return true
    },
    [draftProfileRef, router, setDraftProfile, setPendingKey],
  )

  const persistField = useCallback(
    async (field: keyof OrgProfile) => {
      const currentValue = draftProfileRef.current[field]

      if (field === "brandPrimary" && !isValidHexColor(currentValue as string | null | undefined)) {
        toast.error("Use a six-digit hex color like #0F172A.")
        return
      }

      if (
        field === "brandColors" &&
        Array.isArray(currentValue) &&
        currentValue.some((entry) => !isValidHexColor(entry))
      ) {
        toast.error("Supporting colors need to use six-digit hex values.")
        return
      }

      const normalizedValue =
        field === "brandPrimary"
          ? normalizeHexColor(currentValue as string | null | undefined)
          : field === "brandColors" && Array.isArray(currentValue)
            ? sanitizePalette(currentValue, draftProfileRef.current.brandPrimary)
            : field === "brandTypography"
              ? sanitizeBrandTypographyConfig(
                  currentValue as BrandTypographyConfig | null | undefined,
                  draftProfileRef.current.brandTypographyPresetId,
                )
              : currentValue

      await persistUpdates({ [field]: normalizedValue } as Partial<OrgProfile>, {
        pendingKey: String(field),
      })
    },
    [draftProfileRef, persistUpdates],
  )

  const handleAssetUpload = useCallback(
    async (field: "logoUrl" | "brandMarkUrl" | "headerUrl", file: File) => {
      const validationError = validateOrgMediaFile(file)
      if (validationError) {
        toast.error(validationError)
        return
      }

      const uploadKind =
        field === "logoUrl"
          ? "logo"
          : field === "brandMarkUrl"
            ? "logo-mark"
            : "header"
      const labels =
        field === "logoUrl"
          ? {
              uploading: "Uploading primary logo...",
              success: "Primary logo saved",
              error: "Unable to save primary logo",
            }
          : field === "brandMarkUrl"
            ? {
                uploading: "Uploading logo mark...",
                success: "Logo mark saved",
                error: "Unable to save logo mark",
              }
            : {
                uploading: "Uploading banner image...",
                success: "Banner image saved",
                error: "Unable to save banner image",
              }
      const toastId = toast.loading(labels.uploading)
      setPendingKey(field)
      try {
        const url = await uploadOrgMedia({ file, kind: uploadKind })
        const ok = await persistUpdates(
          { [field]: url } as Partial<OrgProfile>,
          {
            pendingKey: field,
            errorMessage: labels.error,
          },
        )
        if (ok) {
          toast.success(labels.success, { id: toastId })
        } else {
          toast.error(labels.error, { id: toastId })
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
        setPendingKey(null)
      }
    },
    [persistUpdates, setPendingKey],
  )

  return {
    isRefreshing,
    persistUpdates,
    persistField,
    handleAssetUpload,
  }
}
