import { describe, expect, it } from "vitest"
import {
  chooseObjectiveDecision,
  completeDecisionAction,
  normalizeObjectivePlans,
  objectiveDraft,
  saveObjectiveDraft,
  setObjectiveStepComplete,
} from "@/features/workspace-objective-planner/client"
import {
  buildPlanParticleSources,
  emptyWorkspaceParticleState,
  normalizeWorkspaceParticleState,
  placeObjectivePlan,
  removeParticle,
} from "@/features/workspace-particles/client"
import {
  buildDefaultBoardState,
  normalizeWorkspaceBoardState,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"

const plan = saveObjectiveDraft(
  {
    title: "Launch training",
    summary: "Train five neighbors",
    steps: ["Draft curriculum", "Confirm site"],
    tools: ["Training partner"],
    channels: ["Newsletter"],
  },
  "plan-training",
  "manual"
)
describe("workspace objective planner", () => {
  it("ignores blank editor lines before applying content limits", () => {
    const saved = saveObjectiveDraft(
      {
        title: "Train neighbors",
        summary: "",
        steps: [...Array(12).fill(""), "Invite trainees"],
        tools: [...Array(6).fill(" "), "Workshop"],
        channels: [...Array(6).fill(""), "Newsletter"],
      },
      "plan-blanks",
      "manual"
    )
    expect(saved.steps.map((step) => step.title)).toEqual(["Invite trainees"])
    expect(saved.tools).toEqual(["Workshop"])
    expect(saved.channels).toEqual(["Newsletter"])
  })
  it("round trips plans, linked cards and connections through saved board and old-client envelope", () => {
    const next = placeObjectivePlan(emptyWorkspaceParticleState(), plan)!
    const board = normalizeWorkspaceBoardState({
      ...buildDefaultBoardState(),
      particles: next,
    })
    expect(board.particles?.plans).toEqual([plan])
    expect(board.particles?.items).toHaveLength(5)
    expect(board.particles?.connections).toHaveLength(4)
    const { particles: _particles, ...oldClient } = board
    expect(normalizeWorkspaceBoardState(oldClient).particles).toEqual(
      board.particles
    )
  })
  it("keeps old particle state unchanged when no plans are stored", () => {
    expect(
      normalizeWorkspaceParticleState(emptyWorkspaceParticleState())
    ).toEqual(emptyWorkspaceParticleState())
  })
  it("validates malformed plans, IDs, booleans, duplicate steps and bounded text", () => {
    expect(
      normalizeObjectivePlans([
        null,
        {},
        { ...plan, id: "../plan" },
        plan,
        plan,
      ])
    ).toEqual([plan])
    const [normalized] = normalizeObjectivePlans([
      {
        ...plan,
        title: "x".repeat(300),
        summary: "y".repeat(2000),
        steps: [
          plan.steps[0],
          plan.steps[0],
          { ...plan.steps[1], complete: "true" },
        ],
        tools: Array(10).fill("tool"),
      },
    ])
    expect(normalized.title).toHaveLength(160)
    expect(normalized.summary).toHaveLength(1200)
    expect(normalized.steps).toHaveLength(2)
    expect(normalized.steps[1].complete).toBe(false)
    expect(normalized.tools).toHaveLength(6)
  })
  it("preserves completed unchanged steps through reorder and clears changed steps", () => {
    const completed = setObjectiveStepComplete(plan, plan.steps[0].id, true)
    const updated = saveObjectiveDraft(
      {
        ...objectiveDraft(completed),
        steps: ["Confirm site", "Draft curriculum", "Order tools"],
      },
      plan.id,
      plan.origin,
      completed
    )
    expect(updated.steps[1]).toEqual(completed.steps[0])
    const edited = saveObjectiveDraft(
      {
        ...objectiveDraft(completed),
        steps: ["Revise curriculum", "Confirm site"],
      },
      plan.id,
      plan.origin,
      completed
    )
    expect(edited.steps.every((step) => !step.complete)).toBe(true)
    expect(new Set(edited.steps.map((step) => step.id)).size).toBe(2)
  })
  it("keeps duplicate-title step identities separate", () => {
    const duplicates = saveObjectiveDraft(
      { ...objectiveDraft(plan), steps: ["Review", "Review"] },
      plan.id,
      "manual"
    )
    const completed = setObjectiveStepComplete(
      duplicates,
      duplicates.steps[0].id,
      true
    )
    expect(
      saveObjectiveDraft(
        objectiveDraft(completed),
        completed.id,
        "manual",
        completed
      ).steps
    ).toEqual(completed.steps)
  })
  it("adds the whole tree atomically and positions it after existing particles", () => {
    const existing = {
      ...emptyWorkspaceParticleState(),
      items: [
        {
          id: "particle-mission",
          source: { kind: "roadmap" as const, id: "mission" },
          x: 1000,
          y: 10,
          size: "large" as const,
        },
      ],
    }
    const next = placeObjectivePlan(existing, plan)!
    expect(next.items[0]).toEqual(existing.items[0])
    expect(
      Math.min(...next.items.slice(1).map((item) => item.x))
    ).toBeGreaterThan(1640)
    const crowded = { ...existing, items: Array(96).fill(existing.items[0]) }
    expect(placeObjectivePlan(crowded, plan)).toBeNull()
    expect(crowded.items).toHaveLength(96)
    expect(
      placeObjectivePlan(
        {
          ...existing,
          connections: Array(297).fill({
            id: "edge",
            source: "a",
            target: "b",
          }),
        },
        plan
      )
    ).toBeNull()
  })
  it("edits a plan without resetting positions, sizes or custom connections", () => {
    const original = normalizeWorkspaceParticleState(
      placeObjectivePlan(emptyWorkspaceParticleState(), plan)
    )
    const moved = {
      ...original,
      items: original.items.map((item) => ({
        ...item,
        x: 123,
        size: "icon" as const,
      })),
    }
    const updated = placeObjectivePlan(moved, {
      ...plan,
      summary: "Revised notes",
    })!
    expect(updated.items).toEqual(moved.items)
    expect(updated.connections).toEqual(moved.connections)
    expect(updated.plans).toHaveLength(1)
    expect(updated.plans?.[0].summary).toBe("Revised notes")
  })
  it("returns a card to the catalog without removing its plan or source", () => {
    const original = normalizeWorkspaceParticleState(
      placeObjectivePlan(emptyWorkspaceParticleState(), plan)
    )
    const next = removeParticle(original, original.items[0].id)
    expect(next.plans).toEqual([plan])
    expect(buildPlanParticleSources(next.plans!)).toHaveLength(5)
    expect(next.connections).toHaveLength(3)
    expect(next.items).toHaveLength(4)
  })
  it("does not accept empty objectives", () => {
    expect(() =>
      saveObjectiveDraft(
        { ...objectiveDraft(plan), title: " " },
        "new",
        "manual"
      )
    ).toThrow("Add an objective")
  })
  it("creates a decision fork and persists choice and branch completion", () => {
    const branched = saveObjectiveDraft(
      {
        ...objectiveDraft(plan),
        decision: {
          question: "Have a site?",
          yesAction: "Schedule training",
          noAction: "Find a site",
        },
      },
      plan.id,
      "manual"
    )
    const placed = normalizeWorkspaceParticleState(
      placeObjectivePlan(emptyWorkspaceParticleState(), branched)
    )
    expect(placed.items).toHaveLength(8)
    expect(placed.connections).toHaveLength(8)
    const chosen = completeDecisionAction(
      chooseObjectiveDecision(branched, "no"),
      "no",
      true
    )
    expect(normalizeObjectivePlans([chosen])[0].decision).toMatchObject({
      choice: "no",
      noComplete: true,
      yesComplete: false,
    })
    expect(
      saveObjectiveDraft(objectiveDraft(chosen), chosen.id, "manual", chosen)
        .decision
    ).toEqual(chosen.decision)
    const edited = saveObjectiveDraft(
      {
        ...objectiveDraft(chosen),
        decision: { ...chosen.decision!, question: "Have an accessible site?" },
      },
      chosen.id,
      "manual",
      chosen
    )
    expect(edited.decision).toMatchObject({
      choice: null,
      noComplete: false,
      yesComplete: false,
    })
  })
  it("adds and removes decision branches without moving existing plan cards", () => {
    const placed = normalizeWorkspaceParticleState(
      placeObjectivePlan(emptyWorkspaceParticleState(), plan)
    )
    const branched = saveObjectiveDraft(
      {
        ...objectiveDraft(plan),
        decision: {
          question: "Ready?",
          yesAction: "Launch",
          noAction: "Prepare",
        },
      },
      plan.id,
      "manual"
    )
    const updated = normalizeWorkspaceParticleState(
      placeObjectivePlan(placed, branched)
    )
    expect(updated.items).toHaveLength(8)
    expect(updated.connections).toHaveLength(8)
    expect(updated.items.slice(0, 5)).toEqual(placed.items)
    const removed = normalizeWorkspaceParticleState(
      placeObjectivePlan(updated, plan)
    )
    expect(removed.items).toEqual(placed.items)
    expect(removed.connections).toHaveLength(4)
  })
  it("rejects incomplete decision inputs instead of silently dropping them", () => {
    expect(() =>
      saveObjectiveDraft(
        {
          ...objectiveDraft(plan),
          decision: { question: "Ready?", yesAction: "", noAction: "" },
        },
        plan.id,
        "manual"
      )
    ).toThrow("both possible actions")
  })
})
