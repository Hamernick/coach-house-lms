import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardSize,
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorStepKind,
  WorkspaceAcceleratorCardStepResource,
  WorkspaceAcceleratorStepStatus,
  WorkspaceAcceleratorTimelineModuleSeed,
} from "../types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeStepStatus(value: unknown): WorkspaceAcceleratorStepStatus {
  if (value === "completed" || value === "in_progress") return value
  return "not_started"
}

function resolveDerivedStepStatus(
  moduleStatus: WorkspaceAcceleratorStepStatus,
  stepKind: WorkspaceAcceleratorStepKind,
): WorkspaceAcceleratorStepStatus {
  if (moduleStatus === "completed") return "completed"
  if (moduleStatus === "not_started") return "not_started"
  if (stepKind === "lesson" || stepKind === "video") return "in_progress"
  return "not_started"
}

function buildModuleStepKinds(module: WorkspaceAcceleratorTimelineModuleSeed): WorkspaceAcceleratorStepKind[] {
  const next: WorkspaceAcceleratorStepKind[] = ["lesson"]
  if (module.videoUrl) next.push("video")
  if (module.resources.length > 0) next.push("resources")
  if (module.hasAssignment) next.push("assignment")
  if (module.hasDeck) next.push("deck")
  return next
}

function resolveStepTitle(stepKind: WorkspaceAcceleratorStepKind) {
  if (stepKind === "lesson") return "Lesson"
  if (stepKind === "video") return "Video"
  if (stepKind === "resources") return "Resources"
  if (stepKind === "assignment") return "Assignment"
  return "Deck"
}

function resolveStepDescription({
  stepKind,
  moduleDescription,
  resourceCount,
  hasDeck,
}: {
  stepKind: WorkspaceAcceleratorStepKind
  moduleDescription: string | null
  resourceCount: number
  hasDeck: boolean
}) {
  if (stepKind === "lesson") return moduleDescription
  if (stepKind === "video") return "Watch the core walkthrough for this lesson."
  if (stepKind === "resources") return resourceCount > 0 ? `${resourceCount} linked resources` : "No resources attached yet."
  if (stepKind === "assignment") return "Complete the assignment to advance this lesson."
  if (hasDeck) return "Review supporting deck materials."
  return null
}

function normalizeResourceKind(value: unknown) {
  if (typeof value !== "string") return "link"
  const normalized = value.trim().toLowerCase()
  if (!normalized) return "link"
  return normalized
}

function normalizeResourceTitle(record: Record<string, unknown>, index: number, fallbackUrl: string) {
  const candidate =
    typeof record.title === "string"
      ? record.title
      : typeof record.label === "string"
        ? record.label
        : typeof record.name === "string"
          ? record.name
          : ""

  if (candidate.trim()) return candidate.trim()
  try {
    const parsed = new URL(fallbackUrl)
    return parsed.hostname.replace(/^www\./, "") || `Resource ${index + 1}`
  } catch {
    return `Resource ${index + 1}`
  }
}

export function normalizeWorkspaceAcceleratorResources(
  value: unknown,
): WorkspaceAcceleratorCardStepResource[] {
  if (!Array.isArray(value)) return []

  const dedupe = new Set<string>()
  const next: WorkspaceAcceleratorCardStepResource[] = []

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index]
    if (!isRecord(entry)) continue
    const url =
      typeof entry.url === "string"
        ? entry.url.trim()
        : typeof entry.href === "string"
          ? entry.href.trim()
          : ""
    if (!url) continue

    const dedupeKey = `${url.toLowerCase()}::${index}`
    if (dedupe.has(dedupeKey)) continue
    dedupe.add(dedupeKey)

    const title = normalizeResourceTitle(entry, index, url)
    const kind = normalizeResourceKind(entry.kind ?? entry.type)
    const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `resource-${index + 1}-${url}`

    next.push({
      id,
      title,
      url,
      kind,
    })
  }

  return next
}

export function buildWorkspaceAcceleratorCardSteps(
  modules: WorkspaceAcceleratorTimelineModuleSeed[],
): WorkspaceAcceleratorCardStep[] {
  const safeModules = modules.filter((timelineModule) => timelineModule.id && timelineModule.title && timelineModule.href)
  const moduleTotal = safeModules.length

  const flattened: WorkspaceAcceleratorCardStep[] = []
  for (let moduleIndex = 0; moduleIndex < safeModules.length; moduleIndex += 1) {
    const timelineModule = safeModules[moduleIndex]!
    const moduleStatus = normalizeStepStatus(timelineModule.status)
    const moduleStepKinds = buildModuleStepKinds(timelineModule)

    for (const stepKind of moduleStepKinds) {
      flattened.push({
        id: `${timelineModule.id}:${stepKind}`,
        moduleId: timelineModule.id,
        moduleTitle: timelineModule.title,
        stepKind,
        stepTitle: resolveStepTitle(stepKind),
        stepDescription: resolveStepDescription({
          stepKind,
          moduleDescription: timelineModule.description,
          resourceCount: timelineModule.resources.length,
          hasDeck: timelineModule.hasDeck,
        }),
        href: timelineModule.href,
        status: resolveDerivedStepStatus(moduleStatus, stepKind),
        stepSequenceIndex: 0,
        stepSequenceTotal: 0,
        moduleSequenceIndex: moduleIndex + 1,
        moduleSequenceTotal: moduleTotal,
        groupTitle: timelineModule.groupTitle || "Accelerator",
        videoUrl: timelineModule.videoUrl,
        durationMinutes: typeof timelineModule.durationMinutes === "number" ? timelineModule.durationMinutes : null,
        resources: timelineModule.resources,
        hasAssignment: Boolean(timelineModule.hasAssignment),
        hasDeck: Boolean(timelineModule.hasDeck),
      })
    }
  }

  const stepTotal = flattened.length
  return flattened.map((step, index) => ({
    ...step,
    stepSequenceIndex: index + 1,
    stepSequenceTotal: stepTotal,
  }))
}

export function resolveWorkspaceAcceleratorCardTargetSize(
  step: WorkspaceAcceleratorCardStep | null,
): WorkspaceAcceleratorCardSize {
  if (!step) return "sm"
  if (step.stepKind === "video" || step.stepKind === "resources") return "md"
  const hasLongDescription = (step.stepDescription?.length ?? 0) > 140
  const hasHeavyMeta = step.hasAssignment || step.hasDeck || step.resources.length > 2 || Boolean(step.videoUrl)
  if (hasLongDescription || hasHeavyMeta) {
    return "md"
  }

  return "sm"
}

export function normalizeWorkspaceAcceleratorCardInput(
  input: WorkspaceAcceleratorCardInput,
): WorkspaceAcceleratorCardInput {
  return {
    steps: Array.isArray(input.steps) ? input.steps : [],
    size: input.size === "md" ? "md" : "sm",
    mode: input.mode === "tasks" ? "tasks" : "setup",
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    allowTaskUpdates: Boolean(input.allowTaskUpdates),
    allowAutoResize: Boolean(input.allowAutoResize),
    storageKey: typeof input.storageKey === "string" ? input.storageKey : undefined,
    onSizeChange: input.onSizeChange,
    onTaskStatusToggle: input.onTaskStatusToggle,
  }
}
