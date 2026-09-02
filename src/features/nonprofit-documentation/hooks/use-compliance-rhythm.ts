"use client"

import { useCallback, useEffect, useState } from "react"

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
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COMPLIANCE_RHYTHM_STORAGE_KEY)
      if (stored) setDraft(sanitizeComplianceRhythm(JSON.parse(stored)))
    } catch {
      // Keep the safe default when browser storage is unavailable or invalid.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(
        COMPLIANCE_RHYTHM_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The builder remains usable when private browsing blocks persistence.
    }
  }, [draft, storageReady])

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
    setDraft(DEFAULT_COMPLIANCE_RHYTHM)
  }, [])

  return {
    draft,
    storageReady,
    updateDraft,
    loadExample,
    reset,
  }
}
