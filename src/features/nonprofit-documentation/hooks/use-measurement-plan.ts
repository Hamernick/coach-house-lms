"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_MEASUREMENT_PLAN,
  MEASUREMENT_PLAN_STORAGE_KEY,
  sanitizeMeasurementPlan,
} from "../lib/measurement-plan"
import type { MeasurementPlanDraft } from "../types"

const EXAMPLE_MEASUREMENT_PLAN: MeasurementPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  programName: "Neighborhood legal navigation pilot",
  stage: "forming",
  decision: "assess-near-term-outcome",
  outcomeLevel: "near-term",
  outcomeStatement:
    "Participating residents better understand available options and complete an appropriate next step within 30 days of an appointment.",
  evaluationQuestion:
    "How, if at all, do participants’ understanding and completion of an appropriate next step change within 30 days, and what barriers shape that experience?",
  indicatorDefinition:
    "Among consenting participants reached at 30 days, the number and percentage who can name an appropriate next step and report completing it; report each result separately with denominator, response rate, and missingness.",
  method: "mixed-methods",
  dataSource:
    "Appointment records, a five-minute voluntary follow-up available by phone or web, and semi-structured interviews with a purposive group of participants who completed or did not complete a next step.",
  collectionSchedule:
    "Record service delivery at each appointment; follow up 30 days later; review results quarterly.",
  expectedRespondents: 40,
  minutesPerResponse: 5,
  cyclesPerYear: 4,
  disaggregationPlan:
    "Review safe, relevant variation by language preference, referral source, accommodation request, and completion status. Do not publish small identifiable groups; document missingness and access barriers.",
  limitations:
    "Follow-up respondents may differ from people not reached. Self-reports may be affected by recall or social desirability. The pilot does not control referral capacity, legal outcomes, agency decisions, court timing, or housing conditions.",
  owner:
    "Program director owns the review; navigators document delivery; a participant advisory group interprets findings before decisions.",
  actionRule:
    "If understanding improves but completion remains low, investigate referral capacity and access barriers before expanding. If the process is inaccessible or creates harm, pause collection and redesign it with participants.",
  hasDataMinimizationReview: true,
  hasAccessibleVoluntaryProcess: true,
  hasParticipantInterpretation: true,
}

export function useMeasurementPlan() {
  const [draft, setDraft] = useState(DEFAULT_MEASUREMENT_PLAN)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MEASUREMENT_PLAN_STORAGE_KEY)
      if (stored) setDraft(sanitizeMeasurementPlan(JSON.parse(stored)))
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
        MEASUREMENT_PLAN_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The planner remains usable when browser persistence is unavailable.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof MeasurementPlanDraft>(
      key: Key,
      value: MeasurementPlanDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  const loadExample = useCallback(() => setDraft(EXAMPLE_MEASUREMENT_PLAN), [])
  const reset = useCallback(() => setDraft(DEFAULT_MEASUREMENT_PLAN), [])

  return { draft, storageReady, updateDraft, loadExample, reset }
}
