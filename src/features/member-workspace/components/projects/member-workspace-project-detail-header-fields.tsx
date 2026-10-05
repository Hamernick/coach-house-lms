"use client"

import type { ReactNode } from "react"
import { Briefcase, Flag, Globe, Timer } from "@phosphor-icons/react/dist/ssr"
import { PROJECT_WORKSTREAM_OPTIONS, type ProjectDetails } from "@/features/platform-admin-dashboard"
import { ProjectHeaderOptionPickers } from "./project-header-option-pickers"
import { cn } from "@/lib/utils"
import { MEMBER_WORKSPACE_PROJECT_PRIORITY_OPTIONS, type MemberWorkspaceProjectDetailDraft } from "./member-workspace-project-detail-editing"
import { DateChip, HeaderMetaChip, SelectChip, headerChipIconClassName } from "./member-workspace-project-detail-header-controls"

export function ProjectDetailHeaderFields({
  project, draft, isOrganization, coach, onChange, onBeginEdit,
}: {
  project: ProjectDetails
  draft: MemberWorkspaceProjectDetailDraft
  isOrganization: boolean
  coach: ReactNode
  onChange: (field: keyof MemberWorkspaceProjectDetailDraft, value: string) => void
  onBeginEdit: () => void
}) {
  return (
    <div className={cn("flex max-w-5xl flex-wrap items-center gap-2 text-xs", isOrganization && "justify-center")}>
      {coach}
      <HeaderMetaChip>ID: #{project.id}</HeaderMetaChip>
      <SelectChip id="member-workspace-project-priority" label="Project priority"
        value={draft.priority} options={MEMBER_WORKSPACE_PROJECT_PRIORITY_OPTIONS}
        leadingIcon={<Flag className={headerChipIconClassName} aria-hidden />}
        onBeginEdit={onBeginEdit} onChange={(value) => onChange("priority", value)} />
      {draft.clientName ? <HeaderMetaChip icon={<Briefcase className={headerChipIconClassName} aria-hidden />}>{draft.clientName}</HeaderMetaChip> : null}
      <DateChip id="member-workspace-project-start-date" label="Start" value={draft.startDate}
        onBeginEdit={onBeginEdit} onChange={(value) => onChange("startDate", value)} />
      <DateChip id="member-workspace-project-end-date" label="End" value={draft.endDate}
        onBeginEdit={onBeginEdit} onChange={(value) => onChange("endDate", value)} />
      {isOrganization ? (
        <>
          {draft.typeLabel ? <HeaderMetaChip>{draft.typeLabel}</HeaderMetaChip> : null}
          {draft.durationLabel ? <HeaderMetaChip>{draft.durationLabel}</HeaderMetaChip> : null}
        </>
      ) : (
        <SelectChip id="member-workspace-project-workstream" label="Workstream" value={draft.durationLabel || "__none__"}
          options={[{ value: "__none__", label: "No workstream" },
            ...PROJECT_WORKSTREAM_OPTIONS.map((option) => ({ value: option.label, label: option.label })),
            ...(draft.durationLabel && !PROJECT_WORKSTREAM_OPTIONS.some((option) => option.label === draft.durationLabel)
              ? [{ value: draft.durationLabel, label: draft.durationLabel }] : [])]}
          leadingIcon={<Timer className={headerChipIconClassName} aria-hidden />}
          onBeginEdit={onBeginEdit} onChange={(value) => onChange("durationLabel", value === "__none__" ? "" : value)} />
      )}
      <ProjectHeaderOptionPickers projectId={project.id} savedTags={(project.source?.tags ?? []).join(", ")}
        savedType={project.source?.typeLabel ?? ""} tags={draft.tags} type={draft.typeLabel} showType={!isOrganization}
        onBeginEdit={onBeginEdit} onChangeTags={(value) => onChange("tags", value)} onChangeType={(value) => onChange("typeLabel", value)} />

      {project.meta.locationLabel ? <HeaderMetaChip icon={<Globe className={headerChipIconClassName} aria-hidden />}>{project.meta.locationLabel}</HeaderMetaChip> : null}
    </div>
  )
}
