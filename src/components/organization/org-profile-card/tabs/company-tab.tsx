"use client"

import { useMemo, useState } from "react"

import type { OrgProfile, OrgProfileErrors } from "../types"
import { buildAddressLines } from "../utils"
import { EditModeSections } from "./company-tab/edit-sections"
import { ViewModeSections } from "./company-tab/display-sections"
import type { CompanyEditProps, CompanyViewProps, SlugStatus } from "./company-tab/types"

export type CompanyTabProps = {
  company: OrgProfile
  errors: OrgProfileErrors
  editMode: boolean
  onInputChange: CompanyEditProps["onInputChange"]
  onUpdate: CompanyEditProps["onUpdate"]
  onDirty: CompanyEditProps["onDirty"]
}

export function CompanyTab({ company, errors, editMode, onInputChange, onUpdate, onDirty }: CompanyTabProps) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(null)

  const addressLines = useMemo(
    () =>
      buildAddressLines({
        street: company.addressStreet,
        city: company.addressCity,
        state: company.addressState,
        postal: company.addressPostal,
        country: company.addressCountry,
        fallback: company.address,
      }),
    [
      company.addressStreet,
      company.addressCity,
      company.addressState,
      company.addressPostal,
      company.addressCountry,
      company.address,
    ],
  )

  const hasAnyBrandLink = useMemo(
    () =>
      [
        company.publicUrl,
        company.newsletter,
        company.twitter,
        company.facebook,
        company.linkedin,
        company.instagram,
        company.youtube,
        company.tiktok,
        company.github,
      ].some((value) => typeof value === "string" && value.trim().length > 0),
    [
      company.publicUrl,
      company.newsletter,
      company.twitter,
      company.facebook,
      company.linkedin,
      company.instagram,
      company.youtube,
      company.tiktok,
      company.github,
    ],
  )


  if (editMode) {
    const editProps: CompanyEditProps = {
      company,
      errors,
      onInputChange,
      onUpdate,
      onDirty,
      slugStatus,
      setSlugStatus,
    }

    return <EditModeSections {...editProps} />
  }

  const viewProps: CompanyViewProps = {
    company,
    addressLines,
    hasAnyBrandLink,
  }

  return <ViewModeSections {...viewProps} />
}
