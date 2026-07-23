import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyNodeInput,
} from "@/features/workspace-ontology"
import type {
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "../../workspace-board-types"

type WorkspaceCalendarEvent =
  WorkspaceSeedData["calendar"]["upcomingEvents"][number]

function buildCalendarEventNode(
  event: WorkspaceCalendarEvent
): WorkspaceOntologyNodeInput {
  return {
    id: `ontology:calendar:${event.id}`,
    label: event.title,
    description:
      event.description?.trim() || new Date(event.starts_at).toLocaleString(),
    category: "calendar",
    kind: "Calendar event",
    status: event.status === "canceled" ? "blocked" : "in-progress",
    statusLabel: event.status === "canceled" ? "Canceled" : "Scheduled",
    relationshipLabel: "scheduled for",
    href: null,
    actionLabel: "Open event",
    actionTarget: { kind: "calendar-event", eventId: event.id },
    keywords: [event.event_type, ...event.assigned_roles],
  }
}

function resolveCalendarMonth(event: WorkspaceCalendarEvent) {
  const date = new Date(event.starts_at)
  if (!Number.isFinite(date.getTime())) {
    return { key: "unscheduled", label: "Date unavailable" }
  }
  return {
    key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
  }
}

function buildCalendarMonthGroups(events: WorkspaceCalendarEvent[]) {
  const groups = new Map<
    string,
    { label: string; events: WorkspaceCalendarEvent[] }
  >()
  for (const event of events) {
    const month = resolveCalendarMonth(event)
    const group = groups.get(month.key) ?? { label: month.label, events: [] }
    group.events.push(event)
    groups.set(month.key, group)
  }
  return [...groups.entries()].map<WorkspaceOntologyNodeInput>(
    ([monthKey, group]) => ({
      id: `ontology:calendar:month:${monthKey}`,
      label: group.label,
      description: `${group.events.length} upcoming ${group.events.length === 1 ? "event" : "events"}.`,
      category: "calendar",
      kind: "Calendar month",
      status: group.events.every((event) => event.status === "canceled")
        ? "blocked"
        : "in-progress",
      statusLabel: `${group.events.length} ${group.events.length === 1 ? "event" : "events"}`,
      relationshipLabel: "contains",
      href: null,
      actionLabel: null,
      children: group.events.map(buildCalendarEventNode),
    })
  )
}

export function buildWorkspaceCalendarOntologyRoot(
  seed: WorkspaceSeedData
): WorkspaceOntologyInput["roots"][number] {
  return {
    id: "calendar",
    label: "Calendar",
    children: buildCalendarMonthGroups(seed.calendar.upcomingEvents),
  }
}

export function buildWorkspaceFiscalOntologyRoot(
  editor: WorkspaceOrganizationEditorData
): WorkspaceOntologyInput["roots"][number] {
  const summary = editor.fiscalSponsorshipWorkflowSummary
  const requiredDocuments = summary?.requiredDocuments ?? []
  const applicationStatus = summary?.applicationStatus ?? null
  const applicationComplete = applicationStatus === "approved"
  const hasFiscalProject = Boolean(editor.fiscalSponsorshipProjectId)
  return {
    id: "fiscal-sponsorship",
    label: "Fiscal sponsorship",
    children: [
      {
        id: "ontology:fiscal:application",
        label: "Application",
        description: applicationStatus
          ? `Current application status: ${applicationStatus.replaceAll("_", " ")}.`
          : "Start the fiscal sponsorship application.",
        category: "fiscal",
        kind: "Application",
        status: applicationComplete
          ? "complete"
          : applicationStatus
            ? "in-progress"
            : "missing",
        statusLabel: applicationStatus?.replaceAll("_", " ") || "Not started",
        relationshipLabel: "requires",
        href: null,
        actionLabel: hasFiscalProject
          ? applicationComplete
            ? "Review application"
            : editor.canEdit
              ? "Continue application"
              : "Review application"
          : null,
        actionTarget: hasFiscalProject
          ? { kind: "fiscal-phase", phaseId: "application-intake" }
          : null,
      },
      {
        id: "ontology:fiscal:documents",
        label: "Required documents",
        description: "Agreements, audit records, and project documentation.",
        category: "documents",
        kind: "Compliance documents",
        status:
          requiredDocuments.length === 0
            ? "missing"
            : requiredDocuments.every((document) => Boolean(document.assetId))
              ? "complete"
              : "in-progress",
        statusLabel:
          requiredDocuments.length === 0
            ? "No requirements loaded"
            : `${requiredDocuments.filter((document) => Boolean(document.assetId)).length}/${requiredDocuments.length} ready`,
        relationshipLabel: "evidenced by",
        href: null,
        actionLabel: hasFiscalProject
          ? editor.canEdit
            ? "Manage documents"
            : "Review documents"
          : null,
        actionTarget: hasFiscalProject
          ? { kind: "fiscal-phase", phaseId: "required-documents" }
          : null,
        children: requiredDocuments.map((document) => ({
          id: `ontology:fiscal:document:${document.id}`,
          label: document.title,
          description:
            document.reviewNotes?.trim() ||
            "Fiscal sponsorship workflow document.",
          category: "documents",
          kind: "Fiscal document",
          status: document.assetId ? "complete" : "missing",
          statusLabel: document.assetId
            ? document.reviewStatus.replaceAll("_", " ")
            : "Missing document",
          relationshipLabel: "requires",
          href: document.viewHref,
          actionLabel: document.viewHref
            ? "View"
            : hasFiscalProject
              ? editor.canEdit
                ? "Add document"
                : "Review workflow"
              : null,
          actionTarget:
            !document.viewHref && hasFiscalProject
              ? { kind: "fiscal-phase", phaseId: "required-documents" }
              : null,
        })),
      },
    ],
  }
}
