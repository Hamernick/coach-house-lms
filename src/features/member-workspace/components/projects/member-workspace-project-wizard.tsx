"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  ProjectWizard,
  type Client,
  type PlatformAdminDashboardLabProject,
  type PlatformAdminDashboardLabStatus,
  type ProjectData,
  type ProjectIntent,
  type StepQuickCreateValue,
} from "@/features/platform-admin-dashboard"
import type {
  MemberWorkspaceCreateProjectFormInput,
  MemberWorkspacePersonOption,
  MemberWorkspaceProjectOrganizationOption,
} from "../../types"
import { toast } from "@/lib/toast"

type MemberWorkspaceProjectWizardProps = {
  createProjectAction?: (
    input: MemberWorkspaceCreateProjectFormInput,
  ) => Promise<{ ok: true; id: string } | { error: string }>
  initialProject?: PlatformAdminDashboardLabProject | null
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
  assigneeOptions?: MemberWorkspacePersonOption[]
  updateProjectAction?: (
    projectId: string,
    input: MemberWorkspaceCreateProjectFormInput,
  ) => Promise<{ ok: true; id: string } | { error: string }>
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10)
}

function defaultEndDateValue(startDate: string) {
  const date = new Date(`${startDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 28)
  return date.toISOString().slice(0, 10)
}

function toDateValue(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : undefined
}

function mapProjectStatusToQuickStatus(status: PlatformAdminDashboardLabStatus) {
  switch (status) {
    case "planned":
      return "todo"
    case "active":
      return "in-progress"
    case "completed":
      return "done"
    case "cancelled":
      return "canceled"
    default:
      return "backlog"
  }
}

function mapQuickStatusToProjectStatus(statusId?: string): PlatformAdminDashboardLabStatus {
  switch (statusId) {
    case "todo":
      return "planned"
    case "in-progress":
      return "active"
    case "done":
      return "completed"
    case "canceled":
      return "cancelled"
    default:
      return "backlog"
  }
}

function formatIntentLabel(intent?: ProjectIntent) {
  if (intent === "delivery") return "Delivery"
  if (intent === "experiment") return "Experiment"
  if (intent === "internal") return "Internal"
  return "Guided setup"
}

function formatPriorityFromIntent(intent?: ProjectIntent) {
  if (intent === "delivery") return "high" as const
  if (intent === "experiment") return "medium" as const
  return "medium" as const
}

function toTitleCase(value?: string) {
  if (!value) return undefined

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function mapQuickCreateToInput({
  value,
  organizationOptions,
}: {
  value: StepQuickCreateValue
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
}): MemberWorkspaceCreateProjectFormInput {
  const startDate = toDateValue(value.startDate) ?? todayDateValue()
  const endDate = toDateValue(value.targetDate) ?? defaultEndDateValue(startDate)
  const selectedOrganization =
    organizationOptions.find((organization) => organization.orgId === value.clientId) ??
    organizationOptions[0]

  return {
    orgId: selectedOrganization?.orgId,
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
    typeLabel:
      value.sprintTypeId === "design"
        ? "Design Sprint"
        : value.sprintTypeId === "dev"
          ? "Dev Sprint"
          : value.sprintTypeId === "planning"
            ? "Planning"
            : undefined,
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
    tags:
      value.tagId === "bug" ||
      value.tagId === "feature" ||
      value.tagId === "enhancement" ||
      value.tagId === "docs"
        ? value.tagId
        : undefined,
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
      (member) => member.trim().toLowerCase() === assigneeId?.trim().toLowerCase(),
    )

  if (!selectedAssignee) {
    return ""
  }

  return typeof selectedAssignee === "string" ? selectedAssignee : selectedAssignee.name
}

function buildGuidedCreateInput({
  data,
  organizationOptions,
}: {
  data: ProjectData
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
}): MemberWorkspaceCreateProjectFormInput {
  const startDate = todayDateValue()
  const endDate = data.deadlineDate || defaultEndDateValue(startDate)
  const selectedOrganization = organizationOptions[0]
  const tags = Array.from(
    new Set(
      [
        data.intent,
        data.structure,
        data.successType !== "undefined" ? data.successType : null,
        data.addStarterTasks ? "starter tasks" : null,
      ]
        .filter(Boolean)
        .map((value) => String(value)),
    ),
  )

  const generatedName =
    data.description?.trim() ||
    `${selectedOrganization?.name ? `${selectedOrganization.name} ` : ""}${formatIntentLabel(
      data.intent,
    )} Project`

  return {
    orgId: selectedOrganization?.orgId,
    name: generatedName,
    description: data.description,
    status: "planned",
    priority: formatPriorityFromIntent(data.intent),
    startDate,
    endDate,
    clientName: selectedOrganization?.name,
    typeLabel: formatIntentLabel(data.intent),
    durationLabel: toTitleCase(data.structure),
    tags: tags.join(", "),
    memberLabels: "",
  }
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
  if (!initialProject) return undefined

  const firstMember = initialProject.members[0]?.trim().toLowerCase()
  const matchingAssigneeId =
    assigneeOptions.find((option) => option.name.trim().toLowerCase() === firstMember)?.id ??
    initialProject.members[0]

  return {
    title: initialProject.name,
    description: initialProject.description,
    assigneeId: matchingAssigneeId,
    startDate: initialProject.startDate,
    statusId: mapProjectStatusToQuickStatus(initialProject.status),
    targetDate: initialProject.endDate,
    priorityId: initialProject.priority,
    clientId: initialProject.organizationId ?? organizationOptions[0]?.orgId,
    sprintTypeId:
      initialProject.typeLabel === "Design Sprint"
        ? "design"
        : initialProject.typeLabel === "Dev Sprint"
          ? "dev"
          : initialProject.typeLabel === "Planning"
            ? "planning"
            : undefined,
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
    tagId: initialProject.tags[0]?.toLowerCase(),
  }
}

export function MemberWorkspaceProjectWizard({
  createProjectAction,
  initialProject,
  onOpenChange,
  open,
  organizationOptions,
  assigneeOptions = [],
  updateProjectAction,
}: MemberWorkspaceProjectWizardProps) {
  const router = useRouter()
  const [renderOpen, setRenderOpen] = useState(open)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setRenderOpen(open)
  }, [open])

  const clientOptions = useMemo<Client[]>(
    () =>
      organizationOptions.map((organization) => ({
        id: organization.orgId,
        name: organization.name,
        status: "active",
      })),
    [organizationOptions],
  )

  const quickCreateUsers = useMemo(
    () =>
      assigneeOptions.map((person) => ({
        id: person.id,
        name: person.name,
        avatar: person.avatarUrl ?? undefined,
      })),
    [assigneeOptions],
  )

  const quickCreateInitialValue = useMemo(
    () =>
      buildQuickCreateInitialValue({
        initialProject,
        assigneeOptions,
        organizationOptions,
      }),
    [assigneeOptions, initialProject, organizationOptions],
  )

  const closeWizard = () => {
    setRenderOpen(false)
    onOpenChange(false)
  }

  const submitProjectInput = (input: MemberWorkspaceCreateProjectFormInput) => {
    startTransition(async () => {
      const result = initialProject
        ? await updateProjectAction?.(initialProject.id, input)
        : await createProjectAction?.(input)

      if (!result) {
        toast.error("Project actions are unavailable.")
        return
      }

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(initialProject ? "Project updated" : "Project created")
      closeWizard()
      router.refresh()

      if (!initialProject) {
        router.push(`/projects/${result.id}`)
      }
    })
  }

  if (!renderOpen) {
    return null
  }

  return (
    <ProjectWizard
      onClose={closeWizard}
      mode={initialProject ? "edit" : "create"}
      skipModeStep={Boolean(initialProject)}
      quickCreateInitialValue={quickCreateInitialValue}
      quickCreateSubmitLabel={initialProject ? "Save Changes" : "Create Project"}
      quickCreateSubmitPending={isPending}
      quickCreateUsers={quickCreateUsers}
      quickCreateClients={clientOptions}
      onQuickCreate={(value) =>
        submitProjectInput({
          ...mapQuickCreateToInput({
            value,
            organizationOptions,
          }),
          memberLabels: mapQuickCreateToMemberLabels({
            assigneeId: value.assigneeId,
            assigneeOptions,
            initialProject,
          }),
        })
      }
      onGuidedCreate={(data) =>
        submitProjectInput(
          buildGuidedCreateInput({
            data,
            organizationOptions,
          }),
        )
      }
      guidedCreateLabel="Create project"
      guidedCreatePending={isPending}
    />
  )
}
