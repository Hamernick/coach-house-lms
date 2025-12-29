"use client"

import type { ChangeEvent } from "react"

import type { OrgProfile, OrgProfileErrors } from "../../types"

export type SlugStatus = {
  available: boolean
  message: string
} | null

export type CompanyEditHandlers = {
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onUpdate: (updates: Partial<OrgProfile>) => void
  onDirty: () => void
  setSlugStatus: (status: SlugStatus) => void
  slugStatus: SlugStatus
}

export type CompanyEditProps = {
  company: OrgProfile
  errors: OrgProfileErrors
} & CompanyEditHandlers

export type CompanyViewProps = {
  company: OrgProfile
  addressLines: string[]
  hasAnyBrandLink: boolean
}
