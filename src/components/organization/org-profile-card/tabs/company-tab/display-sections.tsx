"use client"


import {
  AddressDisplay,
  BrandLink,
  FieldText,
  FormRow,
  LinkText,
  ProfileField,
  TagList,
} from "@/components/organization/org-profile-card/shared"
import type { CompanyViewProps } from "./types"

export function IdentityPreview({ company }: CompanyViewProps) {
  if (!([company.description, company.ein].some((value) => typeof value === "string" && value.trim()))) {
    return null
  }

  return (
    <FormRow title="Identity">
      <div className="grid gap-4 md:grid-cols-2">
        {typeof company.description === "string" && company.description.trim() ? (
          <ProfileField label="Description">
            <FieldText text={company.description} multiline />
          </ProfileField>
        ) : null}
        {typeof company.ein === "string" && company.ein.trim() ? (
          <ProfileField label="EIN">
            <FieldText text={company.ein} />
          </ProfileField>
        ) : null}
      </div>
    </FormRow>
  )
}

export function ContactPreview({ company }: CompanyViewProps) {
  if (!([company.rep, company.email, company.phone].some((value) => typeof value === "string" && value.trim()))) {
    return null
  }

  return (
    <FormRow title="Contact">
      <div className="grid gap-4 md:grid-cols-2">
        {typeof company.rep === "string" && company.rep.trim() ? (
          <ProfileField label="Representative">
            <FieldText text={company.rep} />
          </ProfileField>
        ) : null}
        {typeof company.email === "string" && company.email.trim() ? (
          <ProfileField label="Email">
            <LinkText text={company.email} />
          </ProfileField>
        ) : null}
        {typeof company.phone === "string" && company.phone.trim() ? (
          <ProfileField label="Phone">
            <FieldText text={company.phone} />
          </ProfileField>
        ) : null}
      </div>
    </FormRow>
  )
}

export function AddressPreview({ addressLines }: CompanyViewProps) {
  if (addressLines.length === 0) {
    return null
  }

  return (
    <FormRow title="Address">
      <AddressDisplay lines={addressLines} />
    </FormRow>
  )
}

const socialFields: Array<{ key: keyof CompanyViewProps["company"]; label: string }> = [
  { key: "twitter", label: "Twitter / X" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "github", label: "GitHub" },
]

export function StoryPreview({ company }: CompanyViewProps) {
  if (!([company.vision, company.need, company.mission, company.values].some((value) => typeof value === "string" && value.trim()))) {
    return null
  }

  return (
    <FormRow title="Story & impact">
      <div className="grid gap-4 md:grid-cols-2">
        {typeof company.vision === "string" && company.vision.trim() ? (
          <ProfileField label="Vision">
            <FieldText text={company.vision} multiline />
          </ProfileField>
        ) : null}
        {typeof company.need === "string" && company.need.trim() ? (
          <ProfileField label="Need statement">
            <FieldText text={company.need} multiline />
          </ProfileField>
        ) : null}
        {typeof company.mission === "string" && company.mission.trim() ? (
          <ProfileField label="Mission">
            <FieldText text={company.mission} multiline />
          </ProfileField>
        ) : null}
        {typeof company.values === "string" && company.values.trim() ? (
          <ProfileField label="Values">
            <TagList value={company.values} />
          </ProfileField>
        ) : null}
      </div>
    </FormRow>
  )
}

export function WebsitePreview({ company }: CompanyViewProps) {
  if (!(typeof company.publicUrl === "string" && company.publicUrl.trim())) {
    return null
  }
  return (
    <FormRow title="Website">
      <BrandLink href={company.publicUrl} />
    </FormRow>
  )
}

export function NewsletterPreview({ company }: CompanyViewProps) {
  if (!(typeof company.newsletter === "string" && company.newsletter.trim())) {
    return null
  }
  return (
    <FormRow title="Newsletter">
      <BrandLink href={company.newsletter} />
    </FormRow>
  )
}

export function SocialPreview({ company, hasAnyBrandLink }: CompanyViewProps) {
  if (!hasAnyBrandLink) {
    return null
  }

  return (
    <FormRow title="Social">
      <div className="grid gap-4 md:grid-cols-2">
        {socialFields.map(({ key, label }) => {
          const value = company[key]
          if (typeof value === "string" && value.trim()) {
            return (
              <ProfileField key={String(key)} label={label}>
                <BrandLink href={value} />
              </ProfileField>
            )
          }
          return null
        })}
      </div>
    </FormRow>
  )
}

export function BrandKitPreview({ company, hasBrandKit }: CompanyViewProps) {
  if (!hasBrandKit) {
    return null
  }

  return (
    <FormRow title="Brand Kit">
      <div className="grid gap-4 md:grid-cols-2">
        {typeof company.logoUrl === "string" && company.logoUrl.trim() ? (
          <ProfileField label="Logo">
            <BrandLink href={company.logoUrl} />
          </ProfileField>
        ) : null}
        {typeof company.boilerplate === "string" && company.boilerplate.trim() ? (
          <ProfileField label="Boilerplate">
            <FieldText text={company.boilerplate} multiline />
          </ProfileField>
        ) : null}
      </div>
    </FormRow>
  )
}

export function ViewModeSections(props: CompanyViewProps) {
  return (
    <div className="grid gap-6">
      <IdentityPreview {...props} />
      <ContactPreview {...props} />
      <AddressPreview {...props} />
      <StoryPreview {...props} />
      <WebsitePreview {...props} />
      <NewsletterPreview {...props} />
      <SocialPreview {...props} />
      <BrandKitPreview {...props} />
    </div>
  )
}
