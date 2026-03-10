import type { ProgramWizardFormState } from "../schema"
import { computeBudgetBreakdown } from "./budget"

function estimateDurationWeeks(durationLabel: string) {
  const normalized = durationLabel.toLowerCase()
  const numeric = normalized.match(/\d+(?:\.\d+)?/)
  const value = numeric ? Number(numeric[0]) : Number.NaN
  if (!Number.isFinite(value)) return null
  if (normalized.includes("month")) return value * 4
  if (normalized.includes("week")) return value
  if (normalized.includes("day")) return value / 7
  return value
}

function estimateSessionsPerWeek(frequency: string) {
  const normalized = frequency.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes("daily")) return 5
  if (normalized.includes("twice") && normalized.includes("week")) return 2
  if (normalized.includes("weekly")) return 1
  if (
    normalized.includes("biweekly") ||
    normalized.includes("every other week")
  ) {
    return 0.5
  }
  if (normalized.includes("monthly")) return 0.25
  return 1
}

export function computeFeasibility(form: ProgramWizardFormState) {
  const people =
    Number(form.pilotPeopleServed) > 0 ? Number(form.pilotPeopleServed) : 0
  const staff = Number(form.staffCount) > 0 ? Number(form.staffCount) : 0
  const budget = computeBudgetBreakdown(form).totalBudget

  const costPerParticipant = people > 0 ? budget / people : null
  const participantsPerStaff = staff > 0 ? people / staff : null

  const durationWeeks = estimateDurationWeeks(form.durationLabel)
  const sessionsPerWeek = estimateSessionsPerWeek(form.frequency)
  const serviceIntensity =
    durationWeeks !== null && sessionsPerWeek !== null
      ? Math.max(0, Math.round(durationWeeks * sessionsPerWeek))
      : null

  const flags: string[] = []
  if (costPerParticipant !== null && costPerParticipant > 3000) {
    flags.push("Very high cost per participant")
  }
  if (participantsPerStaff !== null && participantsPerStaff > 40) {
    flags.push("Low staffing for this many participants")
  }
  if (!form.startMonth || !form.frequency.trim() || !form.durationLabel.trim()) {
    flags.push("No schedule yet")
  }

  return {
    costPerParticipant,
    participantsPerStaff,
    serviceIntensity,
    flags,
  }
}

export function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not enough data"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))
}

export function ratio(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not enough data"
  return `${value.toFixed(1)} participants per staff`
}
