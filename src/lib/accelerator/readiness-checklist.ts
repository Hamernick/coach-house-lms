export type ReadinessChecklistItem = {
  href: string
  label: string
}

const READINESS_REASON_TO_CTA: Record<string, { href: string; label: string }> = {
  "Set a program funding goal": {
    href: "/my-organization?view=editor&tab=programs",
    label: "Set a program funding goal",
  },
  "Upload legal formation document": {
    href: "/my-organization/documents",
    label: "Upload legal document",
  },
  "Upload verification letter": {
    href: "/my-organization/documents",
    label: "Upload verification letter",
  },
  "Formation status must be approved": {
    href: "/my-organization?view=editor&tab=company",
    label: "Set formation status",
  },
}

export function buildReadinessChecklist(options: {
  reasons: string[]
  nextFormationModuleHref?: string | null
  nextCoreRoadmapHref?: string | null
  maxItems?: number
}): ReadinessChecklistItem[] {
  const { reasons, nextFormationModuleHref, nextCoreRoadmapHref, maxItems = 3 } = options

  const mapped = reasons
    .map((reason) => {
      if (reason === "Complete formation lessons") {
        return {
          href: nextFormationModuleHref ?? "/accelerator/class/formation/module/1",
          label: "Complete formation lessons",
        }
      }
      if (reason === "Complete core roadmap sections") {
        return {
          href: nextCoreRoadmapHref ?? "/accelerator/roadmap/origin-story",
          label: "Complete core roadmap sections",
        }
      }
      return READINESS_REASON_TO_CTA[reason] ?? null
    })
    .filter((entry): entry is ReadinessChecklistItem => Boolean(entry))

  return mapped
    .filter(
      (entry, index, all) => all.findIndex((candidate) => candidate.href === entry.href && candidate.label === entry.label) === index,
    )
    .slice(0, maxItems)
}
