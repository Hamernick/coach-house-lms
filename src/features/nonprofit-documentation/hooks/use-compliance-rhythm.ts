"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import {
  COMPLIANCE_RHYTHM_STORAGE_KEY,
  DEFAULT_COMPLIANCE_RHYTHM,
  sanitizeComplianceRhythm,
} from "../lib/compliance-rhythm"
import type { ComplianceRhythmDraft } from "../types"

const EXAMPLE_COMPLIANCE_RHYTHM: ComplianceRhythmDraft = {
  version: 1,
  stateCode: "NY",
  taxYearEnd: "2026-12-31",
  receiptsBand: "under-200k",
  assetsBand: "under-500k",
  solicitsContributions: true,
  hasEmployees: true,
}

export function useComplianceRhythm() {
  const [draft, setDraft] = useState(DEFAULT_COMPLIANCE_RHYTHM)
  const { storageReady, storageStatus, authorizeResetAfterReadFailure } =
    useDocumentationDraftPersistence(
      COMPLIANCE_RHYTHM_STORAGE_KEY,
      draft,
      setDraft,
      sanitizeComplianceRhythm
    )

  const updateDraft = useCallback(
    <Key extends keyof ComplianceRhythmDraft>(
      key: Key,
      value: ComplianceRhythmDraft[Key]
    ) => {
      setDraft((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const loadExample = useCallback(() => {
    setDraft(EXAMPLE_COMPLIANCE_RHYTHM)
  }, [])

  const reset = useCallback(() => {
    authorizeResetAfterReadFailure()
    setDraft(DEFAULT_COMPLIANCE_RHYTHM)
  }, [authorizeResetAfterReadFailure])

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  }
}
