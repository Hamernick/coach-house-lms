import { describe, expect, it } from "vitest"

import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import type {
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"
import { buildWorkspaceCanvasOntologyInput } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/adapters/workspace-canvas-ontology-input"
import { buildWorkspaceOrganizationOntologyRoot } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/adapters/workspace-canvas-ontology-input-organization"
import {
  buildDefaultWorkspaceOntologyState,
  buildWorkspaceOntologyProjection,
  searchWorkspaceOntologyNodes,
} from "@/features/workspace-ontology"

function buildFixture({ canEdit = true }: { canEdit?: boolean } = {}) {
  const boardState = buildDefaultBoardState()
  boardState.tracker = {
    ...boardState.tracker,
    categories: [
      {
        id: "category-1",
        title: "Launch",
        archived: false,
        createdAt: "2026-07-19T12:00:00.000Z",
      },
    ],
    tickets: [
      {
        id: "task-1",
        categoryId: "category-1",
        title: "File annual report",
        description: "Submit the current filing.",
        status: "in_progress",
        priority: "high",
        dueAt: "2026-08-01T12:00:00.000Z",
        assigneeUserIds: ["member-1"],
        archived: false,
        createdAt: "2026-07-19T12:00:00.000Z",
        updatedAt: "2026-07-19T12:00:00.000Z",
      },
    ],
  }
  const seed = {
    canEdit,
    hasAcceleratorAccess: true,
    boardState,
    members: [
      {
        userId: "member-1",
        name: "Avery Rivera",
        email: "avery@example.org",
      },
    ],
    activityFeed: [
      {
        id: "activity-1",
        title: "Board meeting",
        description: null,
        status: "scheduled",
        href: null,
        source: "calendar",
        type: "meeting",
      },
      {
        id: "accelerator-activity-1",
        title: "Foundation updated",
        description: null,
        status: "completed",
        href: "/accelerator",
        source: "accelerator",
        type: "accelerator",
        metadata: { moduleId: "module-1" },
      },
    ],
    roadmapSections: [],
    acceleratorTimeline: [
      {
        id: "step-1",
        moduleId: "module-1",
        moduleTitle: "Foundation",
        groupTitle: "Start",
        stepKind: "video",
        stepTitle: "Introduction",
        stepDescription: null,
        stepSequenceTotal: 2,
        status: "complete",
        href: "/accelerator/step-1",
      },
      {
        id: "step-2",
        moduleId: "module-1",
        moduleTitle: "Foundation",
        groupTitle: "Start",
        stepKind: "assignment",
        stepTitle: "What problem are you solving?",
        stepDescription: null,
        stepSequenceTotal: 5,
        status: "not_started",
        href: "/accelerator/step-2",
      },
      {
        id: "step-3",
        moduleId: "module-1",
        moduleTitle: "Foundation",
        groupTitle: "Start",
        stepKind: "video",
        stepTitle: "Video",
        stepDescription: null,
        stepSequenceTotal: 5,
        status: "not_started",
        href: "/accelerator/step-3",
      },
      {
        id: "step-4",
        moduleId: "module-1",
        moduleTitle: "Foundation",
        groupTitle: "Start",
        stepKind: "resources",
        stepTitle: "Resources",
        stepDescription: null,
        stepSequenceTotal: 5,
        status: "not_started",
        href: "/accelerator/step-4",
      },
      {
        id: "step-5",
        moduleId: "module-1",
        moduleTitle: "Foundation",
        groupTitle: "Start",
        stepKind: "complete",
        stepTitle: "Complete",
        stepDescription: null,
        stepSequenceTotal: 5,
        status: "not_started",
        href: "/accelerator/step-5",
      },
    ],
    calendar: {
      upcomingEvents: [
        {
          id: "event-1",
          title: "Board strategy session",
          description: "Approve the operating plan.",
          starts_at: "2026-08-12T16:00:00.000Z",
          status: "scheduled",
          event_type: "meeting",
          assigned_roles: ["Board chair"],
        },
      ],
    },
  } as unknown as WorkspaceSeedData
  const editor = {
    canEdit,
    initialProfile: {
      name: "Example Foundation",
      mission: "",
      vision: "",
      email: "hello@example.org",
      address: "",
      logoUrl: null,
    },
    people: [
      {
        id: "person-1",
        name: "Avery Rivera",
        email: "avery@example.org",
        title: "Executive Director",
      },
    ],
    programs: [
      {
        id: "program-1",
        title: "Community lab",
        description: "",
      },
    ],
    documentsTab: { documents: {} },
    fiscalSponsorshipProjectId: "fiscal-project-1",
    fiscalSponsorshipWorkflowSummary: {
      applicationStatus: null,
      requiredDocuments: [],
    },
  } as unknown as WorkspaceOrganizationEditorData
  return { seed, editor }
}

describe("workspace ontology input", () => {
  it("maps real workspace domains, ownership, actions, and relationships", () => {
    const { seed, editor } = buildFixture()
    const input = buildWorkspaceCanvasOntologyInput({
      seed,
      editor,
      placedPersonIds: ["person-1"],
    })
    const allNodes = input.roots.flatMap(function flatten(root) {
      const visit = (
        node: (typeof root.children)[number]
      ): typeof root.children => [node, ...(node.children ?? []).flatMap(visit)]
      return root.children.flatMap(visit)
    })

    expect(
      allNodes.find((node) => node.id === "ontology:task:task-1")
    ).toMatchObject({
      category: "tasks",
      status: "in-progress",
      ownerLabel: "Avery Rivera",
      href: null,
      actionLabel: "Open task",
      actionTarget: { kind: "task", ticketId: "task-1" },
    })
    expect(
      allNodes.find((node) => node.id === "ontology:organization:documents")
    ).toMatchObject({
      status: "missing",
      relationshipLabel: "Next step",
      href: "/organization/documents",
    })
    expect(
      allNodes.find((node) => node.id === "ontology:organization:field:mission")
    ).toMatchObject({
      href: "/workspace?view=editor&tab=company&focus=mission",
    })
    expect(
      allNodes.find((node) => node.id === "ontology:organization:people")
    ).toMatchObject({ href: "/people" })
    expect(
      allNodes.find(
        (node) => node.id === "ontology:accelerator:module:module-1"
      )
    ).toMatchObject({
      status: "in-progress",
      href: "/workspace/accelerator?step=step-2&module=module-1",
    })
    expect(
      allNodes.find(
        (node) => node.id === "ontology:activity:accelerator-activity-1"
      )
    ).toMatchObject({
      href: "/workspace/accelerator?step=step-2&module=module-1",
    })
    expect(
      allNodes.some((node) => node.href?.match(/^\/accelerator(?:\/|$)/))
    ).toBe(false)
    expect(
      allNodes.find((node) => node.id === "ontology:fiscal:documents")
    ).toMatchObject({
      status: "missing",
      actionTarget: {
        kind: "fiscal-phase",
        phaseId: "required-documents",
      },
    })
    expect(
      allNodes.find((node) => node.id === "ontology:calendar:event-1")
    ).toMatchObject({
      actionLabel: "Open event",
      actionTarget: { kind: "calendar-event", eventId: "event-1" },
    })
    expect(input.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "ontology:organization:people",
          target: "workspace-person:person-1",
          label: "staffed by",
        }),
        expect.objectContaining({
          source: "ontology:programs:portfolio",
          target: "ontology:tasks:portfolio",
          label: "executed through",
        }),
      ])
    )
  })

  it("routes document steps to the exact document-manager row", () => {
    const { editor } = buildFixture()
    const root = buildWorkspaceOrganizationOntologyRoot({
      editor: {
        ...editor,
        documentsTab: {
          ...editor.documentsTab,
          documents: { verificationLetter: null },
        },
      },
    })
    const documents = root.children.find(
      (node) => node.id === "ontology:organization:documents"
    )

    expect(documents?.children?.[0]).toMatchObject({
      id: "ontology:document:verificationLetter",
      href: "/organization/documents?focus=verificationLetter",
    })
  })

  it("keeps accelerator ontology at module or lesson granularity", () => {
    const { seed, editor } = buildFixture()
    const assignmentStep = seed.acceleratorTimeline?.find(
      (step) => step.stepKind === "assignment"
    )
    if (!assignmentStep) throw new Error("Assignment step fixture is required")
    assignmentStep.moduleContext = {
      classTitle: "Start with the problem",
      lessonNotesContent: "Define the need before designing the response.",
      moduleResources: [
        {
          label: "Community needs assessment guide",
          url: "https://example.org/needs-assessment",
          provider: "generic",
        },
      ],
      assignmentFields: [
        {
          name: "affected-community",
          label: "Who experiences this problem most directly?",
          description: "Name the people and place affected by the problem.",
          placeholder: "For example, families in South Shore…",
          type: "long_text",
          required: true,
          screen: "question",
        },
      ],
      assignmentSubmission: null,
      completeOnSubmit: false,
    }
    const input = buildWorkspaceCanvasOntologyInput({ seed, editor })
    const acceleratorRoot = input.roots.find(
      (root) => root.id === "accelerator"
    )
    const acceleratorNodes = acceleratorRoot?.children ?? []
    const moduleCount = new Set(
      seed.acceleratorTimeline?.map((step) => step.moduleId)
    ).size
    const allAcceleratorNodes = acceleratorNodes.flatMap(
      function flatten(node): typeof acceleratorNodes {
        return [node, ...(node.children ?? []).flatMap(flatten)]
      }
    )

    expect(acceleratorNodes).toHaveLength(moduleCount)
    expect(acceleratorNodes).toHaveLength(1)
    expect(acceleratorNodes[0]).toMatchObject({
      id: "ontology:accelerator:module:module-1",
      label: "Foundation",
      status: "in-progress",
      statusLabel: "In progress",
      actionLabel: expect.stringMatching(/^(Open|Review) (module|lesson)$/),
      href: "/workspace/accelerator?step=step-2&module=module-1",
    })
    expect(
      allAcceleratorNodes.some((node) =>
        node.href?.match(/^\/accelerator(?:\/|$)/)
      )
    ).toBe(false)
    expect(acceleratorNodes[0]?.kind).toMatch(/module|lesson/i)
    expect(acceleratorNodes[0]?.children ?? []).toEqual([])
    expect(acceleratorNodes[0]?.keywords).toEqual(
      expect.arrayContaining([
        "What problem are you solving?",
        "Video",
        "Resources",
        "Who experiences this problem most directly?",
        "Name the people and place affected by the problem.",
        "Community needs assessment guide",
      ])
    )
    const projection = buildWorkspaceOntologyProjection({
      input,
      state: buildDefaultWorkspaceOntologyState(),
      filter: { query: "", categories: [] },
    })
    expect(
      searchWorkspaceOntologyNodes({
        nodes: projection.allNodes,
        query: "who experiences this problem",
      }).map((node) => node.id)
    ).toContain("ontology:accelerator:module:module-1")
    expect(allAcceleratorNodes).toHaveLength(moduleCount)
    expect(
      allAcceleratorNodes.some((node) =>
        /video|resource|assignment|question|section|complete/i.test(node.kind)
      )
    ).toBe(false)
    expect(
      allAcceleratorNodes.some((node) =>
        node.id.startsWith("ontology:accelerator:step:")
      )
    ).toBe(false)
    expect(
      [acceleratorRoot?.label, ...allAcceleratorNodes.map((node) => node.label)]
        .filter(Boolean)
        .some((label) => label?.trim().toLowerCase() === "complete")
    ).toBe(false)
  })

  it("keeps every upcoming calendar event behind compact month groups", () => {
    const { seed, editor } = buildFixture()
    seed.calendar.upcomingEvents = Array.from({ length: 25 }, (_, index) => ({
      id: `event-${index + 1}`,
      title: `Operating event ${index + 1}`,
      description: null,
      starts_at: `2026-${index < 13 ? "08" : "09"}-${String((index % 13) + 1).padStart(2, "0")}T16:00:00.000Z`,
      ends_at: null,
      all_day: false,
      recurrence: null,
      status: "active",
      event_type: "meeting",
      assigned_roles: [],
    }))

    const input = buildWorkspaceCanvasOntologyInput({ seed, editor })
    const calendarRoot = input.roots.find((root) => root.id === "calendar")
    const monthGroups = calendarRoot?.children ?? []
    const events = monthGroups.flatMap((group) => group.children ?? [])
    const calendarRelationships = (input.relationships ?? []).filter(
      (relationship) => relationship.category === "calendar"
    )

    expect(monthGroups).toHaveLength(2)
    expect(monthGroups.every((group) => group.kind === "Calendar month")).toBe(
      true
    )
    expect(events).toHaveLength(25)
    expect(new Set(events.map((event) => event.id)).size).toBe(25)
    expect(calendarRelationships).toHaveLength(25)
  })

  it("uses review actions for read-only viewers", () => {
    const { seed, editor } = buildFixture({ canEdit: false })
    const input = buildWorkspaceCanvasOntologyInput({ seed, editor })
    const program = input.roots
      .find((root) => root.id === "programs")
      ?.children.find((node) => node.id === "ontology:programs:portfolio")
      ?.children?.[0]
    const fiscalApplication = input.roots
      .find((root) => root.id === "fiscal-sponsorship")
      ?.children.find((node) => node.id === "ontology:fiscal:application")

    expect(program?.actionLabel).toBe("Open program")
    expect(fiscalApplication?.actionLabel).toBe("Review application")
  })

  it("uses the live tracker instead of the stale seed snapshot", () => {
    const { seed, editor } = buildFixture()
    const tracker = {
      ...seed.boardState.tracker,
      tickets: seed.boardState.tracker.tickets.map((ticket) => ({
        ...ticket,
        title: "Live operating objective",
      })),
    }

    const input = buildWorkspaceCanvasOntologyInput({ seed, editor, tracker })
    const task = input.roots
      .find((root) => root.id === "programs")
      ?.children.flatMap((node) => node.children ?? [])
      .flatMap((node) => node.children ?? [])
      .find((node) => node.id === "ontology:task:task-1")

    expect(task?.label).toBe("Live operating objective")
  })

  it("does not expose dead fiscal actions before a workflow exists", () => {
    const { seed, editor } = buildFixture()
    editor.fiscalSponsorshipProjectId = null

    const input = buildWorkspaceCanvasOntologyInput({ seed, editor })
    const fiscalNodes =
      input.roots.find((root) => root.id === "fiscal-sponsorship")?.children ??
      []

    expect(fiscalNodes).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ focusRoot: true })])
    )
    expect(fiscalNodes.map((node) => node.actionLabel)).toEqual([null, null])
  })

  it("keeps calendar events canonical and emits one staff edge per person", () => {
    const { seed, editor } = buildFixture()
    seed.calendar.upcomingEvents = [
      {
        id: "event-1",
        title: "Board meeting",
        description: "Quarterly governance meeting.",
        event_type: "board_meeting",
        starts_at: "2026-08-01T15:00:00.000Z",
        ends_at: "2026-08-01T16:00:00.000Z",
        all_day: false,
        recurrence: null,
        status: "active",
        assigned_roles: ["board"],
      },
    ]
    seed.activityFeed = [
      {
        id: "calendar:event-1",
        title: "Board meeting",
        description: "Quarterly governance meeting.",
        status: "scheduled",
        timestamp: "2026-08-01T15:00:00.000Z",
        href: "/workspace",
        source: "calendar",
        type: "calendar_board_meeting",
      },
    ]

    const input = buildWorkspaceCanvasOntologyInput({
      seed,
      editor,
      placedPersonIds: ["person-1", " person-1 ", "person-1"],
    })
    const allNodes = input.roots.flatMap(function flatten(root) {
      const visit = (
        node: (typeof root.children)[number]
      ): typeof root.children => [node, ...(node.children ?? []).flatMap(visit)]
      return root.children.flatMap(visit)
    })
    const staffEdges = input.relationships?.filter(
      (relationship) =>
        relationship.source === "ontology:organization:people" &&
        relationship.target === "workspace-person:person-1"
    )
    const eventEdges = input.relationships?.filter(
      (relationship) =>
        relationship.source === "ontology:programs:activity" &&
        relationship.target === "ontology:calendar:event-1"
    )

    expect(
      allNodes.filter((node) => node.id === "ontology:calendar:event-1")
    ).toHaveLength(1)
    expect(
      allNodes.some((node) => node.id === "ontology:activity:calendar:event-1")
    ).toBe(false)
    expect(eventEdges).toEqual([
      expect.objectContaining({ label: "scheduled as" }),
    ])
    expect(staffEdges).toEqual([
      expect.objectContaining({ label: "staffed by" }),
    ])
    expect(new Set(allNodes.map((node) => node.id)).size).toBe(allNodes.length)
  })

  it("connects the people branch only to roots of the placed staff forest", () => {
    const { seed, editor } = buildFixture()
    editor.people = [
      { id: "director", name: "Director", reportsToId: null },
      { id: "manager", name: "Manager", reportsToId: "director" },
      { id: "coordinator", name: "Coordinator", reportsToId: "manager" },
      { id: "advisor", name: "Advisor", reportsToId: null },
    ] as typeof editor.people

    const input = buildWorkspaceCanvasOntologyInput({
      seed,
      editor,
      placedPersonIds: ["director", "manager", "coordinator", "advisor"],
    })
    const staffTargets = input.relationships
      ?.filter(
        (relationship) => relationship.source === "ontology:organization:people"
      )
      .map((relationship) => relationship.target)

    expect(staffTargets).toEqual([
      "workspace-person:director",
      "workspace-person:advisor",
    ])
  })
})
