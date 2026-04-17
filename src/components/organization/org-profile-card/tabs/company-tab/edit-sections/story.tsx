"use client"

import { Textarea } from "@/components/ui/textarea"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function StorySection({ company, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="About us" description="What you do, why it matters, and how change happens.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Origin story">
          <Textarea
            name="originStory"
            value={company.originStory ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="We started after seeing students and families navigate fragmented support alone."
          />
        </ProfileField>
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
        <ProfileField label="Theory of change">
          <Textarea
            name="theoryOfChange"
            value={company.theoryOfChange ?? ""}
            onChange={onInputChange}
            rows={4}
            placeholder="When students, mentors, and core supports are connected early, confidence and long-term opportunity grow."
          />
        </ProfileField>
      </div>
    </FormRow>
  )
}
