export type AcceleratorReadinessChecklistItem = {
  label: string
  href: string
}

export type AcceleratorOrgSnapshotStripProps = {
  organizationTitle: string
  organizationSubtitle?: string | null
  organizationDescription?: string | null
  logoUrl?: string | null
  headerUrl?: string | null
  fundingGoalCents: number
  formationLabel: string
  programsCount: number
  peopleCount: number
  progressPercent: number
  lessonsComplete: number
  lessonsTotal: number
  deliverablesComplete: number
  deliverablesTotal: number
  moduleGroupsComplete: number
  moduleGroupsTotal: number
  fundableCheckpoint?: number
  verifiedCheckpoint?: number
  readinessStateLabel?: "Building" | "Fundable" | "Verified"
  readinessTargetLabel?: string | null
  readinessChecklist?: AcceleratorReadinessChecklistItem[]
  editHref?: string
}
