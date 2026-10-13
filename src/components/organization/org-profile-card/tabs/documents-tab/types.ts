import type { OrgDocument, OrgDocuments } from "../../types"

export type DocumentDefinition = {
  kind: string
  key: keyof OrgDocuments
  title: string
  description: string
  defaultName: string
  category: string
}

export type DocumentStatus = "missing" | "not_started" | "in_progress" | "ready" | "published"
export type DocumentSource = "upload" | "policy" | "roadmap"
export type DocumentVisibility = "private" | "public"

export type SortColumn = "status" | "name" | "category" | "source" | "visibility" | "updatedAt"
export type SortDirection = "asc" | "desc"

export type DocumentsRoadmapSection = {
  id: string
  title: string
  subtitle: string
  slug: string
  status: "not_started" | "in_progress" | "complete"
  lastUpdated: string | null
  isPublic: boolean
}

export type DocumentsPolicyEntry = {
  id: string
  title: string
  summary: string
  status: "not_started" | "in_progress" | "complete"
  categories: string[]
  programId: string | null
  personIds: string[]
  document: OrgDocument | null
  updatedAt: string | null
}

export type DocumentsOption = {
  id: string
  label: string
}

export type UploadRow = {
  id: string
  source: "upload"
  name: string
  description: string
  categories: string[]
  status: DocumentStatus
  visibility: "private"
  updatedAt: string | null
  definition: DocumentDefinition
  document: OrgDocument | null
}

export type PolicyRow = {
  id: string
  source: "policy"
  name: string
  description: string
  categories: string[]
  status: DocumentStatus
  visibility: "private"
  updatedAt: string | null
  policy: DocumentsPolicyEntry
}

export type RoadmapRow = {
  id: string
  source: "roadmap"
  name: string
  description: string
  categories: string[]
  status: DocumentStatus
  visibility: DocumentVisibility
  updatedAt: string | null
  section: DocumentsRoadmapSection
}

export type DocumentIndexRow = UploadRow | PolicyRow | RoadmapRow

export type DocumentsTabProps = {
  userId: string
  documents?: OrgDocuments | null
  policyEntries: DocumentsPolicyEntry[]
  policyProgramOptions: DocumentsOption[]
  policyPeopleOptions: DocumentsOption[]
  roadmapSections: DocumentsRoadmapSection[]
  publicSlug?: string | null
  editMode: boolean
  canEdit: boolean
}

export type PolicyDraft = {
  id?: string
  title: string
  summary: string
  status: DocumentsPolicyEntry["status"]
  categories: string[]
  programId: string
  personIds: string[]
  document: OrgDocument | null
}
