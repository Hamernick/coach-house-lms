import { format } from "date-fns"

import { htmlToMarkdown } from "@/lib/markdown/convert"
import type { OrganizationProjectRecord } from "./project-starter-data"

type ProjectOverviewSeedTask = {
  title: string
}

type ParsedProjectOverviewSections = {
  summaryLines: string[]
  goalLines: string[]
  scopeIn: string[]
  scopeOut: string[]
  outcomes: string[]
  featureLines: string[]
  featureP0: string[]
  featureP1: string[]
  featureP2: string[]
}

export type MemberWorkspaceProjectOverviewContent = {
  description: string
  scopeIn: string[]
  scopeOut: string[]
  outcomes: string[]
  keyFeaturesP0: string[]
  keyFeaturesP1: string[]
  keyFeaturesP2: string[]
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function parseDateOnly(input: string) {
  return new Date(`${input}T00:00:00.000Z`)
}

function normalizeList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeHeading(line: string) {
  return line
    .replace(/\*\*/g, "")
    .replace(/:+$/, "")
    .trim()
    .toLowerCase()
}

function stripBulletPrefix(line: string) {
  return line
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .trim()
}

function splitHeadingValue(line: string) {
  const cleaned = line.replace(/\*\*/g, "").trim()
  const separatorIndex = cleaned.indexOf(":")
  if (separatorIndex === -1) {
    return { heading: normalizeHeading(cleaned), inlineValue: "" }
  }

  return {
    heading: normalizeHeading(cleaned.slice(0, separatorIndex)),
    inlineValue: cleaned.slice(separatorIndex + 1).trim(),
  }
}

function createEmptySections(): ParsedProjectOverviewSections {
  return {
    summaryLines: [],
    goalLines: [],
    scopeIn: [],
    scopeOut: [],
    outcomes: [],
    featureLines: [],
    featureP0: [],
    featureP1: [],
    featureP2: [],
  }
}

function parseProjectOverviewSections(
  description: string | null | undefined,
): ParsedProjectOverviewSections {
  if (!description?.trim()) {
    return createEmptySections()
  }

  const markdown = htmlToMarkdown(description)
  if (!markdown) {
    return createEmptySections()
  }

  const sections = createEmptySections()
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  let currentSection:
    | "goalLines"
    | "scopeIn"
    | "scopeOut"
    | "outcomes"
    | "featureLines"
    | "featureP0"
    | "featureP1"
    | "featureP2"
    | null = null

  for (const line of lines) {
    const { heading, inlineValue } = splitHeadingValue(line)

    if (heading === "goal") {
      currentSection = "goalLines"
      if (inlineValue) sections.goalLines.push(inlineValue)
      continue
    }

    if (heading === "scope" || heading === "in scope") {
      currentSection = "scopeIn"
      if (inlineValue) sections.scopeIn.push(inlineValue)
      continue
    }

    if (heading === "out of scope") {
      currentSection = "scopeOut"
      if (inlineValue) sections.scopeOut.push(inlineValue)
      continue
    }

    if (heading === "expected outcomes" || heading === "outcomes") {
      currentSection = "outcomes"
      if (inlineValue) sections.outcomes.push(inlineValue)
      continue
    }

    if (heading === "key feature" || heading === "key features") {
      currentSection = "featureLines"
      if (inlineValue) sections.featureLines.push(inlineValue)
      continue
    }

    if (heading === "p0") {
      currentSection = "featureP0"
      if (inlineValue) sections.featureP0.push(inlineValue)
      continue
    }

    if (heading === "p1") {
      currentSection = "featureP1"
      if (inlineValue) sections.featureP1.push(inlineValue)
      continue
    }

    if (heading === "p2") {
      currentSection = "featureP2"
      if (inlineValue) sections.featureP2.push(inlineValue)
      continue
    }

    const value = stripBulletPrefix(line)
    if (!value) {
      continue
    }

    if (!currentSection) {
      sections.summaryLines.push(value)
      continue
    }

    sections[currentSection].push(value)
  }

  sections.summaryLines = normalizeList(sections.summaryLines)
  sections.goalLines = normalizeList(sections.goalLines)
  sections.scopeIn = normalizeList(sections.scopeIn)
  sections.scopeOut = normalizeList(sections.scopeOut)
  sections.outcomes = normalizeList(sections.outcomes)
  sections.featureLines = normalizeList(sections.featureLines)
  sections.featureP0 = normalizeList(sections.featureP0)
  sections.featureP1 = normalizeList(sections.featureP1)
  sections.featureP2 = normalizeList(sections.featureP2)

  return sections
}

function buildFallbackDescription(project: Pick<
  OrganizationProjectRecord,
  "name" | "description" | "client_name" | "type_label" | "duration_label"
>) {
  const summary = [
    project.client_name ? `for ${project.client_name}` : null,
    project.type_label,
    project.duration_label,
  ]
    .filter(Boolean)
    .join(" • ")

  if (summary) {
    return `${project.name} is currently tracking work ${summary}. Use this page to manage scope, delivery, and project tasks in one place.`
  }

  return `${project.name} is currently being tracked in the organization workspace. Use this page to manage scope, delivery, and project tasks in one place.`
}

function buildFallbackScope(
  project: Pick<OrganizationProjectRecord, "tags">,
) {
  const tagScope = (project.tags ?? [])
    .slice(0, 3)
    .map((tag) => `Deliver ${toTitleCase(tag)} work`)

  return {
    scopeIn:
      tagScope.length > 0
        ? tagScope
        : [
            "Track active milestones and due dates",
            "Coordinate assigned collaborators",
            "Deliver approved project scope",
          ],
    scopeOut: [
      "Unapproved scope changes",
      "Work outside the current project backlog",
    ],
  }
}

function buildFallbackOutcomes(
  project: Pick<OrganizationProjectRecord, "name" | "end_date" | "task_count" | "member_labels">,
) {
  const memberCount = project.member_labels?.length ?? 0

  return [
    `Deliver ${project.name} by ${format(parseDateOnly(project.end_date), "MMM d, yyyy")}`,
    project.task_count > 0
      ? `Complete ${project.task_count} tracked task${project.task_count === 1 ? "" : "s"}`
      : "Add and complete the first tracked tasks",
    memberCount > 0
      ? `Coordinate ${memberCount} assigned collaborator${memberCount === 1 ? "" : "s"}`
      : "Assign collaborators as project staffing changes",
  ]
}

function buildFallbackFeatureItems(
  project: Pick<OrganizationProjectRecord, "tags">,
  tasks: ProjectOverviewSeedTask[],
) {
  const taskLabels = tasks.slice(0, 5).map((task) => task.title.trim()).filter(Boolean)
  if (taskLabels.length > 0) {
    return taskLabels
  }

  const tagLabels = (project.tags ?? []).map((tag) => toTitleCase(tag))
  if (tagLabels.length > 0) {
    return tagLabels
  }

  return ["Core execution plan", "Operational follow-through"]
}

function distributeFeatureItems(items: string[]) {
  const normalized = normalizeList(items)
  return {
    p0: normalized.slice(0, 2),
    p1: normalized.slice(2, 4),
    p2: normalized.slice(4, 6),
  }
}

export function buildMemberWorkspaceProjectOverviewContent({
  project,
  tasks,
}: {
  project: Pick<
    OrganizationProjectRecord,
    | "name"
    | "description"
    | "client_name"
    | "type_label"
    | "duration_label"
    | "tags"
    | "end_date"
    | "task_count"
    | "member_labels"
  >
  tasks: ProjectOverviewSeedTask[]
}): MemberWorkspaceProjectOverviewContent {
  const parsed = parseProjectOverviewSections(project.description)
  const fallbackScope = buildFallbackScope(project)
  const fallbackOutcomes = buildFallbackOutcomes(project)
  const fallbackFeatures = distributeFeatureItems(buildFallbackFeatureItems(project, tasks))

  const explicitFeatureColumns =
    parsed.featureP0.length > 0 || parsed.featureP1.length > 0 || parsed.featureP2.length > 0
  const parsedFeatureColumns = explicitFeatureColumns
    ? {
        p0: parsed.featureP0,
        p1: parsed.featureP1,
        p2: parsed.featureP2,
      }
    : distributeFeatureItems(parsed.featureLines)

  return {
    description:
      normalizeList(parsed.goalLines).join(" ") ||
      normalizeList(parsed.summaryLines).join(" ") ||
      buildFallbackDescription(project),
    scopeIn: parsed.scopeIn.length > 0 ? parsed.scopeIn : fallbackScope.scopeIn,
    scopeOut: parsed.scopeOut.length > 0 ? parsed.scopeOut : fallbackScope.scopeOut,
    outcomes: parsed.outcomes.length > 0 ? parsed.outcomes : fallbackOutcomes,
    keyFeaturesP0:
      parsedFeatureColumns.p0.length > 0 ? parsedFeatureColumns.p0 : fallbackFeatures.p0,
    keyFeaturesP1:
      parsedFeatureColumns.p1.length > 0 ? parsedFeatureColumns.p1 : fallbackFeatures.p1,
    keyFeaturesP2:
      parsedFeatureColumns.p2.length > 0 ? parsedFeatureColumns.p2 : fallbackFeatures.p2,
  }
}
