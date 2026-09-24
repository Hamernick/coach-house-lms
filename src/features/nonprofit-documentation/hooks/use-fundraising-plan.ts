"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

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
  const { storageReady, storageStatus, authorizeResetAfterReadFailure } =
    useDocumentationDraftPersistence(
      FUNDRAISING_PLAN_STORAGE_KEY,
      draft,
      setDraft,
      sanitizeFundraisingPlan
    )

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
  const reset = useCallback(() => {
    authorizeResetAfterReadFailure()
    setDraft(DEFAULT_FUNDRAISING_PLAN)
  }, [authorizeResetAfterReadFailure])

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateChannelTarget,
    loadExample,
    reset,
  }
}
