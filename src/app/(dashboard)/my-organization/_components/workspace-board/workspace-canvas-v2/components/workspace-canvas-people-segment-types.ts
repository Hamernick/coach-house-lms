import type { PersonCategory } from "@/lib/people/categories"

export type WorkspaceAllPeopleSegment = {
  id: "all"
  kind: "all"
  label: string
  count: number
}

export type WorkspaceCategoryPeopleSegment = {
  id: string
  kind: "category"
  label: string
  category: PersonCategory
  count: number
}

export type WorkspaceCustomPeopleSegment = {
  id: string
  kind: "custom"
  label: string
  memberIds: string[]
  count: number
}

export type WorkspacePeopleSegment =
  | WorkspaceAllPeopleSegment
  | WorkspaceCategoryPeopleSegment
  | WorkspaceCustomPeopleSegment
