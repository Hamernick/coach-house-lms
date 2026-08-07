import type { PersonCategory } from "@/lib/people/categories"
import type { OrganizationPeopleSegment } from "@/lib/people/segments"

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

export type WorkspaceCustomPeopleSegment = OrganizationPeopleSegment & {
  kind: "custom"
  count: number
}

export type WorkspacePeopleSegment =
  | WorkspaceAllPeopleSegment
  | WorkspaceCategoryPeopleSegment
  | WorkspaceCustomPeopleSegment
