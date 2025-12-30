"use client"

import { Textarea } from "@/components/ui/textarea"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function ProgramsReportsSection({ company, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Programs & reports" description="Highlight key programs and impact reports.">
      <div className="grid gap-6">
        <ProfileField label="Programs">
          <Textarea
            name="programs"
            value={company.programs ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="After-school STEM clubs, summer internships, parent workshops"
          />
        </ProfileField>
        <ProfileField label="Reports">
          <Textarea
            name="reports"
            value={company.reports ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="2024 Impact Report (link), Annual report, Evaluation summary"
          />
        </ProfileField>
      </div>
    </FormRow>
  )
}
