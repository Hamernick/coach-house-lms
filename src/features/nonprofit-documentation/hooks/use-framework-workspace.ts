"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_LOGIC_MODEL_DRAFT,
  FRAMEWORK_WORKSPACE_STORAGE_KEY,
  sanitizeLogicModelDraft,
} from "../lib/framework-workspace"
import type { LogicModelDraft } from "../types"

const EXAMPLE_LOGIC_MODEL_DRAFT: LogicModelDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  programName: "Neighborhood legal navigation pilot",
  stage: "forming",
  primaryQuestion: "plan-program",
  need: "Residents facing housing or public-benefits questions report uncertainty about eligibility, trusted help, cost, confidentiality, and appropriate next steps.",
  people:
    "Adults in three service ZIP codes, especially residents who prefer Spanish or need a trusted community referral.",
  inputs:
    "Two trained navigators, partner referral relationships, reviewed service information, bilingual materials, accessible meeting space, scheduling tools, supervision, and pilot funding.",
  activities:
    "Publish accessible eligibility information; brief referral partners; offer bilingual 30-minute navigation appointments; document questions, referrals, and follow-up needs.",
  outputs:
    "Partner briefings completed, information pages distributed, appointments offered and completed, referrals made, accommodations provided, and follow-up contacts attempted.",
  nearTermOutcomes:
    "Participating residents better understand available options, eligibility, documents, referrals, and an appropriate next step.",
  intermediateOutcomes:
    "More participating residents complete timely referrals or administrative next steps and report fewer unresolved navigation barriers.",
  longTermContribution:
    "The pilot may contribute to more timely problem resolution and stronger neighborhood access to trusted legal and public-benefit navigation.",
  assumptions:
    "Residents trust the referral source; appointments are available when needed; information is accurate and usable; language and disability access are sufficient; referrals have capacity; navigation is appropriate for the question.",
  context:
    "Housing markets, agency rules, court schedules, legal-service capacity, immigration concerns, digital access, transportation, language access, and changes in public-benefit policy may affect the pathway.",
  learningQuestion:
    "Which information, access, trust, or capacity barriers most often prevent residents from completing the next step after an appointment?",
}

export function useFrameworkWorkspace() {
  const [draft, setDraft] = useState(DEFAULT_LOGIC_MODEL_DRAFT)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        FRAMEWORK_WORKSPACE_STORAGE_KEY
      )
      if (stored) setDraft(sanitizeLogicModelDraft(JSON.parse(stored)))
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
        FRAMEWORK_WORKSPACE_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The workspace remains usable when private browsing blocks persistence.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof LogicModelDraft>(
      key: Key,
      value: LogicModelDraft[Key]
    ) => {
      setDraft((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const loadExample = useCallback(() => setDraft(EXAMPLE_LOGIC_MODEL_DRAFT), [])
  const reset = useCallback(() => setDraft(DEFAULT_LOGIC_MODEL_DRAFT), [])

  return { draft, storageReady, updateDraft, loadExample, reset }
}
