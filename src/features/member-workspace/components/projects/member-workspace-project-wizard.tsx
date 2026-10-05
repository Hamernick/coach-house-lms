"use client"

import { defaultProjectOrganizationId, NO_PROJECT_ORGANIZATION } from "../../lib/project-organization"

import { loadSharedProjectOptions, manageSharedProjectOption } from "../../project-workflow-actions"
import type { ProjectOptionSettings } from "../../lib/project-option-settings"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useEffect, useMemo, useState, useTransition } from "react"
import { GuidedProjectSetup } from "./guided-project-setup"
import { usePathname, useRouter } from "next/navigation"

import {
  ProjectWizard,
  type Client,
  type PlatformAdminDashboardLabProject,
  type PlatformAdminDashboardLabStatus,
  type StepQuickCreateValue,
} from "@/features/platform-admin-dashboard"
import type {
  MemberWorkspaceCreateProjectFormInput,
  MemberWorkspacePersonOption,
  MemberWorkspaceProjectOrganizationOption,
} from "../../types"
import { withSaveFeedback } from "@/lib/with-save-feedback"
import { projectDateToLocalCalendar, projectDateToValue } from "@/lib/project-date"
import { ProjectFiscalSponsorshipOption } from "./project-fiscal-sponsorship-option"
import { ProjectRecurrenceSelect } from "./project-recurrence-select"
import { ProjectWizardDeleteAction } from "./project-wizard-delete-action"

type MemberWorkspaceProjectWizardProps = {
  onSaved?: (id: string, input: MemberWorkspaceCreateProjectFormInput, taskCount?: number) => void
  deleteProjectAction?: (projectId: string) => Promise<{ ok: true; id: string } | { error: string }>
  createProjectAction?: (
    input: MemberWorkspaceCreateProjectFormInput
  ) => Promise<{ ok: true; id: string } | { error: string }>
  initialProject?: PlatformAdminDashboardLabProject | null
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
  assigneeOptions?: MemberWorkspacePersonOption[]
  updateProjectAction?: (
    projectId: string,
    input: MemberWorkspaceCreateProjectFormInput
  ) => Promise<{ ok: true; id: string } | { error: string }>
}

const ORGANIZATION_STATUS_OPTIONS = [
  { id: "todo", label: "Onboarding", dotClass: "bg-orange-600" },
  { id: "in-progress", label: "Active", dotClass: "bg-teal-600" },
  { id: "canceled", label: "Archived", dotClass: "bg-zinc-500" },
]

const PROJECT_STATUS_OPTIONS = [
  { id: "backlog", label: "Backlog", dotClass: "bg-zinc-500" },
  { id: "planned", label: "Planned", dotClass: "bg-blue-600" },
  { id: "active", label: "Active", dotClass: "bg-teal-600" },
  { id: "on-hold", label: "On hold", dotClass: "bg-amber-500" },
  { id: "completed", label: "Completed", dotClass: "bg-emerald-600" },
  { id: "cancelled", label: "Cancelled", dotClass: "bg-zinc-500" },
]

function toDateValue(date?: Date) {
  return date ? projectDateToValue(date) : undefined
}

function mapProjectStatusToQuickStatus(
  status: PlatformAdminDashboardLabStatus
) {
  switch (status) {
    case "active":
      return "in-progress"
    case "completed":
    case "cancelled":
      return "canceled"
    default:
      return "todo"
  }
}

function mapQuickStatusToProjectStatus(
  statusId?: string
): PlatformAdminDashboardLabStatus {
  switch (statusId) {
    case "backlog":
    case "planned":
    case "active":
    case "on-hold":
    case "completed":
    case "cancelled":
      return statusId
    case "todo":
      return "planned"
    case "in-progress":
      return "active"
    case "canceled":
      return "cancelled"
    default:
      return "planned"
  }
}

function mapQuickCreateToInput({
  value,
  organizationOptions,
}: {
  value: StepQuickCreateValue
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
}): MemberWorkspaceCreateProjectFormInput {
  const startDate = toDateValue(value.startDate) ?? null
  const endDate =
    toDateValue(value.targetDate) ?? null
  const selectedOrganization =
    organizationOptions.find(
      (organization) => organization.orgId === value.clientId
    )

  return {
    recurrence: value.recurrence,
    orgId: selectedOrganization?.orgId ?? null,
    name: value.title,
    description: value.description,
    status: mapQuickStatusToProjectStatus(value.statusId),
    priority:
      value.priorityId === "urgent" ||
      value.priorityId === "high" ||
      value.priorityId === "medium" ||
      value.priorityId === "low"
        ? value.priorityId
        : "medium",
    startDate,
    endDate,
    clientName: selectedOrganization?.name,
    typeLabel: value.sprintTypeLabel ?? (
      value.sprintTypeId === "design"
        ? "Design Sprint"
        : value.sprintTypeId === "dev"
          ? "Dev Sprint"
          : value.sprintTypeId === "planning"
            ? "Planning"
            : value.sprintTypeId?.trim() || undefined),
    durationLabel:
      value.workstreamId === "frontend"
        ? "Frontend"
        : value.workstreamId === "backend"
          ? "Backend"
          : value.workstreamId === "design"
            ? "Design"
            : value.workstreamId === "qa"
              ? "QA"
              : undefined,
    tags: value.tagLabel?.trim() || value.tagId?.trim() || undefined,
    optionSettings: value.optionSettings,
    memberLabels: value.assigneeId ? undefined : undefined,
  }
}

function mapQuickCreateToMemberLabels({
  assigneeId,
  assigneeOptions,
  initialProject,
}: {
  assigneeId?: string
  assigneeOptions: MemberWorkspacePersonOption[]
  initialProject?: PlatformAdminDashboardLabProject | null
}) {
  const selectedAssignee =
    assigneeOptions.find((option) => option.id === assigneeId) ??
    initialProject?.members.find(
      (member) =>
        member.trim().toLowerCase() === assigneeId?.trim().toLowerCase()
    )

  const primaryMember = typeof selectedAssignee === "string"
    ? selectedAssignee
    : selectedAssignee?.name
  return [...new Set([primaryMember, ...(initialProject?.members.slice(1) ?? [])].filter(Boolean))].join(",")
}

function buildQuickCreateInitialValue({
  initialProject,
  assigneeOptions,
  organizationOptions,
}: {
  initialProject?: PlatformAdminDashboardLabProject | null
  assigneeOptions: MemberWorkspacePersonOption[]
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
}): Partial<StepQuickCreateValue> | undefined {
  if (!initialProject) return { clientId: defaultProjectOrganizationId(organizationOptions) ?? NO_PROJECT_ORGANIZATION }

  const firstMember = initialProject.members[0]?.trim().toLowerCase()
  const matchingAssigneeId =
    assigneeOptions.find(
      (option) => option.name.trim().toLowerCase() === firstMember
    )?.id ?? initialProject.members[0]

  return {
    recurrence: initialProject.recurrence ?? "none",
    title: initialProject.name,
    description: initialProject.description,
    assigneeId: matchingAssigneeId ?? "__unassigned_project_owner__",
    startDate: initialProject.startDate ? projectDateToLocalCalendar(initialProject.startDate) : undefined,
    statusId: mapProjectStatusToQuickStatus(initialProject.status),
    targetDate: initialProject.endDate ? projectDateToLocalCalendar(initialProject.endDate) : undefined,
    priorityId: initialProject.priority,
    clientId: initialProject.organizationUnassigned ? NO_PROJECT_ORGANIZATION : initialProject.organizationId,
    sprintTypeId:
      initialProject.typeLabel === "Design Sprint"
        ? "design"
        : initialProject.typeLabel === "Dev Sprint"
          ? "dev"
          : initialProject.typeLabel === "Planning"
            ? "planning"
            : initialProject.typeLabel || undefined,
    workstreamId:
      initialProject.durationLabel === "Frontend"
        ? "frontend"
        : initialProject.durationLabel === "Backend"
          ? "backend"
          : initialProject.durationLabel === "Design"
            ? "design"
            : initialProject.durationLabel === "QA"
              ? "qa"
              : undefined,
    tagId: initialProject.tags[0],
  }
}

export function MemberWorkspaceProjectWizard({
  onSaved,
  deleteProjectAction,
  createProjectAction,
  initialProject,
  onOpenChange,
  open,
  organizationOptions,
  assigneeOptions = [],
  updateProjectAction,
}: MemberWorkspaceProjectWizardProps) {
  const router = useRouter()
  const directoryHref = (usePathname() ?? "").startsWith("/projects") ? "/projects" : "/organizations"
  const [optionSettings, setOptionSettings] = useState<ProjectOptionSettings | undefined>();
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loadedOptionsFor, setLoadedOptionsFor] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState("");
  useEffect(() => {
    let active = true;
    setOptionSettings(undefined); setOptionsError(""); setLoadedOptionsFor(null); setOptionsLoading(false);
    if (!open) return;
    setOptionsLoading(true);
    loadSharedProjectOptions().then((result) => {
      if (!active) return;
      if ("error" in result) setOptionsError(result.error ?? "Unable to load project options.");
      else setOptionSettings(result.settings);
    }).catch(() => { if (active) setOptionsError("Unable to load project options. Close and reopen to retry."); })
      .finally(() => { if (active) { setOptionsLoading(false); setLoadedOptionsFor(initialProject?.id ?? "new"); } });
    return () => { active = false; };
  }, [open, initialProject?.id]);
  const [fiscalSponsorshipEnabled, setFiscalSponsorshipEnabled] = useState(false)
  useEffect(() => { if (open) setFiscalSponsorshipEnabled(false) }, [open])
  const [renderOpen, setRenderOpen] = useState(open)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setRenderOpen(open)
  }, [open])

  const clientOptions = useMemo<Client[]>(
    () =>
      [...(initialProject?.projectKind === "organization_admin" ? [] : [{ id: NO_PROJECT_ORGANIZATION, name: "No organization", status: "active" as const }]), ...organizationOptions.map((organization) => ({
        id: organization.orgId,
        name: organization.name,
        status: "active" as const,
      }))],
    [initialProject?.projectKind, organizationOptions]
  )

  const quickCreateUsers = useMemo(() => {
    const users = assigneeOptions.map((person) => ({
      id: person.id, name: person.name, avatar: person.avatarUrl ?? undefined,
    }))
    const originalOwner = initialProject?.members[0]
    if (initialProject && !originalOwner) {
      users.unshift({ id: "__unassigned_project_owner__", name: "Unassigned", avatar: undefined })
    } else if (originalOwner && !users.some(user => user.name.trim().toLowerCase() === originalOwner.trim().toLowerCase())) {
      // Existing labels are preserved without inventing a linked platform account.
      users.unshift({ id: originalOwner, name: originalOwner, avatar: undefined })
    }
    return users
  }, [assigneeOptions, initialProject])

  const quickCreateInitialValue = useMemo(
    () =>
      buildQuickCreateInitialValue({
        initialProject,
        assigneeOptions,
        organizationOptions,
      }),
    [assigneeOptions, initialProject, organizationOptions]
  )

  const closeWizard = () => {
    setRenderOpen(false)
    onOpenChange(false)
  }

  const resolvedInitialValue = useMemo(() => ({
    ...quickCreateInitialValue,
    ...(directoryHref === "/projects" && initialProject ? { statusId: initialProject.status } : {}),
    optionSettings,
    ...(initialProject ? { sprintTypeId: initialProject.typeLabel } : {}),
  }), [quickCreateInitialValue, directoryHref, initialProject, optionSettings]);

  const submitProjectInput = (input: MemberWorkspaceCreateProjectFormInput) => {
    startTransition(async () => {
      const label = directoryHref === "/projects" ? "Project" : "Organization"
      const result = await withSaveFeedback(
        async () => initialProject
          ? updateProjectAction?.(initialProject.id, input)
          : createProjectAction?.({ ...input, fiscalSponsorshipEnabled }),
        { pending: initialProject ? "Saving changes…" : `Creating ${label.toLowerCase()}…`, success: `${label} ${initialProject ? "updated" : "created"}` },
      )
      if ("error" in result) return
      onSaved?.(result.id, initialProject ? input : { ...input, fiscalSponsorshipEnabled })
      closeWizard()
      router.refresh()

      if (!initialProject && directoryHref !== "/projects") {
        router.push(`${directoryHref}/${result.id}`)
      }
    })
  }

  if (!renderOpen) {
    return null
  }

  if (loadedOptionsFor !== (initialProject?.id ?? "new")) {
    return <Dialog open onOpenChange={(next) => { if (!next) closeWizard(); }}>
      <DialogContent><DialogTitle>{initialProject ? "Edit project" : "Create project"}</DialogTitle><DialogDescription>Loading project options…</DialogDescription></DialogContent>
    </Dialog>
  }

  return (
    <ProjectWizard
      quickCreateRecurrenceControl={directoryHref === "/projects" ? (value, onChange) => (
        <div className="flex flex-col gap-4">
          <ProjectRecurrenceSelect value={value} onChange={onChange} disabled={isPending} />
          {!initialProject ? <ProjectFiscalSponsorshipOption checked={fiscalSponsorshipEnabled} onChange={setFiscalSponsorshipEnabled} disabled={isPending} /> : null}
        </div>
      ) : undefined}
      quickCreateFooterAction={initialProject && initialProject.projectKind !== "organization_admin" && deleteProjectAction ? (
        <ProjectWizardDeleteAction projectId={initialProject.id} projectName={initialProject.name} disabled={isPending} deleteProjectAction={deleteProjectAction} onDeleted={() => { closeWizard(); router.refresh(); }} />
      ) : undefined}
      renderGuidedSetup={() => <GuidedProjectSetup organizations={organizationOptions} onSaved={onSaved} onClose={closeWizard} directoryHref={directoryHref} />}
      onClose={() => { if (!isPending) closeWizard() }}
      mode={initialProject ? "edit" : "create"}
      skipModeStep={Boolean(initialProject)}
      quickCreateInitialValue={resolvedInitialValue}
      quickCreateSubmitLabel={
        initialProject ? "Save Changes" : directoryHref === "/projects" ? "Create project" : "Create Organization"
      }
      quickCreateError={optionsError}
      manageOption={(kind, action, option) => manageSharedProjectOption({ kind, action, option })}
      quickCreateSubmitPending={isPending || optionsLoading}
      quickCreateUsers={quickCreateUsers}
      quickCreateStatuses={directoryHref === "/projects" ? PROJECT_STATUS_OPTIONS : ORGANIZATION_STATUS_OPTIONS}
      quickCreateClients={clientOptions}
      onQuickCreate={(value) =>
        submitProjectInput({
          ...mapQuickCreateToInput({
            value,
            organizationOptions,
          }),
          tags: [value.tagLabel ?? value.tagId, ...(initialProject?.tags.slice(1) ?? [])].filter(Boolean).join(","),
          memberLabels: mapQuickCreateToMemberLabels({
            assigneeId: value.assigneeId,
            assigneeOptions,
            initialProject,
          }),
        })
      }
      guidedCreateLabel="Create project"
      guidedCreatePending={isPending}
    />
  )
}
