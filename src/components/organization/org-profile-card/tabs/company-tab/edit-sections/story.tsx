"use client"

import { Textarea } from "@/components/ui/textarea"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function StorySection({ company, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Story & impact" description="What you do and why it matters.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Vision">
          <Textarea
            name="vision"
            value={company.vision ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="A city where every student has access to high-quality STEM learning."
          />
        </ProfileField>
        <ProfileField label="Mission">
          <Textarea
            name="mission"
            value={company.mission ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="We equip middle school students with hands-on programs and mentors in technology careers."
          />
        </ProfileField>
        <ProfileField label="Our need">
          <Textarea
            name="need"
            value={company.need ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="Students in our district lack access to labs, internships, and career exposure."
          />
        </ProfileField>
        <ProfileField label="Values">
          <Textarea
            name="values"
            value={company.values ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="Equity, curiosity, community"
          />
        </ProfileField>
      </div>
    </FormRow>
  )
}
