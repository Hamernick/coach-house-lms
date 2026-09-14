"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FUNDRAISING_PLAN,
  FUNDRAISING_PLAN_STORAGE_KEY,
  sanitizeFundraisingPlan,
} from "../lib/fundraising-plan"
import type { FundraisingChannelId, FundraisingPlanDraft } from "../types"

const EXAMPLE_FUNDRAISING_PLAN: FundraisingPlanDraft = {
  version: 1,
  organizationName: "East Harbor Youth Arts",
  stage: "operating",
  periodMonths: 12,
  fundingGoal: 120_000,
  committedFunds: 30_000,
  channelTargets: {
    individuals: 35_000,
    foundations: 25_000,
    government: 10_000,
    corporate: 10_000,
    events: 10_000,
  },
  hasCaseForSupport: true,
  hasGiftAcknowledgmentProcess: true,
}

export function useFundraisingPlan() {
  const [draft, setDraft] = useState(DEFAULT_FUNDRAISING_PLAN)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FUNDRAISING_PLAN_STORAGE_KEY)
      if (stored) setDraft(sanitizeFundraisingPlan(JSON.parse(stored)))
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
        FUNDRAISING_PLAN_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The builder remains usable when private browsing blocks persistence.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof FundraisingPlanDraft>(
      key: Key,
      value: FundraisingPlanDraft[Key]
    ) => {
      setDraft((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const updateChannelTarget = useCallback(
    (channelId: FundraisingChannelId, value: number) => {
      setDraft((current) => ({
        ...current,
        channelTargets: {
          ...current.channelTargets,
          [channelId]: value,
        },
      }))
    },
    []
  )

  const loadExample = useCallback(() => setDraft(EXAMPLE_FUNDRAISING_PLAN), [])
  const reset = useCallback(() => setDraft(DEFAULT_FUNDRAISING_PLAN), [])

  return {
    draft,
    storageReady,
    updateDraft,
    updateChannelTarget,
    loadExample,
    reset,
  }
}
