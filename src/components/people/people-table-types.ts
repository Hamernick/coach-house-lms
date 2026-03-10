import type { OrgPerson } from "@/actions/people"

export type PersonRow = OrgPerson & { displayImage?: string | null }
