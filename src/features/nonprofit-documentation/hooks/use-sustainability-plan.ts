"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_SUSTAINABILITY_PLAN,
  SUSTAINABILITY_PLAN_STORAGE_KEY,
  sanitizeSustainabilityPlan,
} from "../lib/sustainability-plan"
import type { SustainabilityPlanDraft } from "../types"

const EXAMPLE_SUSTAINABILITY_PLAN: SustainabilityPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  initiativeName: "Neighborhood legal navigation pilot",
  stage: "operating",
  direction: "stabilize",
  horizonMonths: 12,
  unrestrictedCash: 45_000,
  expectedUnrestrictedRevenue: 150_000,
  restrictedFunds: 120_000,
  monthlyCoreCosts: 9_000,
  monthlyProgramCosts: 6_000,
  weeklyAvailableHours: 120,
  weeklyCommittedHours: 132,
  missionPriority:
    "Maintain timely, trusted, bilingual navigation that helps participating residents understand and complete an appropriate next step.",
  essentialCommitments:
    "Two navigators, supervision, language access, current referral information, confidential records, accessible appointment options, insurance, follow-up, and responsible notice if service changes.",
  fundingAssumptions:
    "A one-year restricted grant covers navigator time but not all supervision, technology, insurance, interpretation, administration, or cash timing. Expected unrestricted revenue is not yet fully committed.",
  peopleDependencies:
    "The program director approves exceptions and holds key funder context. Two navigators maintain most referral relationships. Temporary coverage and cross-training are incomplete.",
  systemsDependencies:
    "Scheduling, secure case notes, current partner capacity, language services, phone access, backups, and documented referral agreements are required for reliable delivery.",
  adaptationTriggers:
    "Pause expansion if the projected flexible balance turns negative, weekly commitments exceed available capacity, referral completion declines materially, or access and safety concerns cannot be resolved.",
  continuityOwner:
    "Executive director owns the scenario; board treasurer reviews finances; program director maintains service-continuity procedures.",
  reviewRhythm:
    "Staff review capacity and delivery monthly; finance committee reviews cash, restrictions, and variance quarterly; the board decides on expansion at month six.",
  hasBoardFinancialReview: true,
  hasRestrictionReview: true,
  hasContinuityPlan: false,
}

export function useSustainabilityPlan() {
  const [draft, setDraft] = useState(DEFAULT_SUSTAINABILITY_PLAN)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        SUSTAINABILITY_PLAN_STORAGE_KEY
      )
      if (stored) setDraft(sanitizeSustainabilityPlan(JSON.parse(stored)))
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
        SUSTAINABILITY_PLAN_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The planner remains usable when browser persistence is unavailable.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof SustainabilityPlanDraft>(
      key: Key,
      value: SustainabilityPlanDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  const loadExample = useCallback(
    () => setDraft(EXAMPLE_SUSTAINABILITY_PLAN),
    []
  )
  const reset = useCallback(() => setDraft(DEFAULT_SUSTAINABILITY_PLAN), [])

  return { draft, storageReady, updateDraft, loadExample, reset }
}
