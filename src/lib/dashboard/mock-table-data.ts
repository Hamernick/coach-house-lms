import type { DashboardTableRow } from "./table-data"

const SECTION_HEADERS = [
  "Cover page",
  "Table of contents",
  "Executive summary",
  "Technical approach",
  "Design",
  "Capabilities",
  "Integration with existing systems",
  "Innovation and advantages",
  "Overview of solutions",
  "Product roadmap",
  "Implementation timeline",
  "Security posture",
  "Training plan",
  "Support model",
  "Budget breakdown",
]

const SECTION_TYPES = [
  "Narrative",
  "Technical content",
  "Checklist",
  "Data table",
  "Appendix",
]

const SECTION_STATUSES = ["Done", "In Process", "Not Started", "Needs Review"]

const SECTION_REVIEWERS = [
  "Eddie Lake",
  "Jamik Tashpulatov",
  "Assign reviewer",
  "Taylor Bae",
  "Morgan Sato",
]

const TARGET_BASE = 6
const TARGET_VARIANCE = 27
const LIMIT_BASE = 5
const LIMIT_VARIANCE = 22

const DUPLICATION_FACTOR = 4

function buildHeader(index: number) {
  const header = SECTION_HEADERS[index % SECTION_HEADERS.length]
  const revision = Math.floor(index / SECTION_HEADERS.length) + 1

  return revision > 1 ? `${header} (Rev ${revision})` : header
}

function buildTarget(index: number) {
  const variance = (index * 3) % TARGET_VARIANCE
  return String(TARGET_BASE + variance)
}

function buildLimit(index: number) {
  const variance = (index * 5) % LIMIT_VARIANCE
  return String(LIMIT_BASE + variance)
}

export function createDashboardTableRows(count = SECTION_HEADERS.length * DUPLICATION_FACTOR): DashboardTableRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    header: buildHeader(index),
    type: SECTION_TYPES[index % SECTION_TYPES.length],
    status: SECTION_STATUSES[index % SECTION_STATUSES.length],
    target: buildTarget(index),
    limit: buildLimit(index),
    reviewer: SECTION_REVIEWERS[index % SECTION_REVIEWERS.length],
  }))
}

export const dashboardTableRows = createDashboardTableRows()
