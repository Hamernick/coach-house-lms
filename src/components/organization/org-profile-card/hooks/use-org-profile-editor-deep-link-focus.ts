"use client"

import { useEffect, type RefObject } from "react"

import type { ProfileTab } from "../types"
import { useOrganizationDeepLinkFocus } from "../organization-deep-link-focus"

export function useOrgProfileEditorDeepLinkFocus({
  canEdit,
  editMode,
  focusKey,
  rootRef,
  setEditMode,
  tab,
}: {
  canEdit: boolean
  editMode: boolean
  focusKey?: string | null
  rootRef: RefObject<HTMLElement | null>
  setEditMode: (next: boolean) => void
  tab: ProfileTab
}) {
  useEffect(() => {
    if (!focusKey?.trim() || tab !== "company" || !canEdit || editMode) return
    setEditMode(true)
  }, [canEdit, editMode, focusKey, setEditMode, tab])

  useOrganizationDeepLinkFocus({
    enabled: tab === "company" && (!canEdit || editMode),
    focusKey,
    rootRef,
  })
}
