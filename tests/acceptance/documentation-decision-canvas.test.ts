import { describe, expect, it } from "vitest"
import {
  buildDocumentationDecisionGraph,
  decisionDraftRevision,
  invalidateDecisionReview,
  readDecisionReview,
} from "../../src/features/documentation-decision-canvas/lib"

const steps = [
  { id: "purpose", label: "Purpose" },
  { id: "content", label: "Content", dependsOn: ["purpose"] },
  { id: "channels", label: "Channels", dependsOn: ["purpose"] },
  { id: "safeguards", label: "Safeguards", dependsOn: ["content", "channels"] },
  { id: "review", label: "Review" },
]

describe("documentation decision planning", () => {
  it("joins independent content and channel decisions before safeguards", () => {
    const graph = buildDocumentationDecisionGraph(steps)
    expect(graph.edges.map(({ source, target }) => [source, target])).toEqual([
      ["purpose", "content"],
      ["purpose", "channels"],
      ["content", "safeguards"],
      ["channels", "safeguards"],
      ["safeguards", "review"],
    ])
    expect(graph.steps[1].position.x).toBe(graph.steps[2].position.x)
    expect(graph.steps[1].position.y).not.toBe(graph.steps[2].position.y)
    expect(graph.steps[0].incoming).toBe(false)
    expect(graph.steps[4].outgoing).toBe(false)
  })

  it("keeps mobile steps readable in a single vertical sequence", () => {
    const mobile = buildDocumentationDecisionGraph(steps, true)
    expect(new Set(mobile.steps.map(({ position }) => position.x)).size).toBe(1)
    expect(
      mobile.steps.every(
        (step, index) =>
          !index || step.position.y > mobile.steps[index - 1].position.y
      )
    ).toBe(true)
    expect(mobile.edges).toEqual(buildDocumentationDecisionGraph(steps).edges)
  })

  it("requires another review downstream of an edited decision, preserving other branches", () => {
    const reviewed = steps.map(({ id }) => id)
    expect(invalidateDecisionReview(reviewed, "content", steps)).toEqual([
      "purpose",
      "channels",
    ])
    expect(invalidateDecisionReview(reviewed, "purpose", steps)).toEqual([])
    expect(invalidateDecisionReview(reviewed, "review", steps)).toEqual([
      "purpose",
      "content",
      "channels",
      "safeguards",
    ])
  })

  it("rejects ambiguous, missing, and cyclic decision dependencies", () => {
    expect(() => buildDocumentationDecisionGraph([steps[0], steps[0]])).toThrow(
      "Duplicate"
    )
    expect(() =>
      buildDocumentationDecisionGraph([
        { id: "a", label: "A", dependsOn: ["missing"] },
      ])
    ).toThrow("must follow")
    expect(() =>
      buildDocumentationDecisionGraph([
        { id: "a", label: "A", dependsOn: ["b"] },
        { id: "b", label: "B", dependsOn: ["a"] },
      ])
    ).toThrow("must follow")
  })

  it("restores only known reviewed steps from the matching draft", () => {
    const revision = decisionDraftRevision('{"name":"Example"}')
    const saved = JSON.stringify({
      revision,
      reviewed: ["purpose", "unknown", "purpose", 1, "channels"],
    })
    expect(
      readDecisionReview(
        saved,
        revision,
        steps.map(({ id }) => id)
      )
    ).toEqual(["purpose", "channels"])
    expect(
      readDecisionReview(saved, decisionDraftRevision('{"name":"Changed"}'), [
        "purpose",
      ])
    ).toEqual([])
    for (const value of [
      null,
      "broken",
      "[]",
      "1",
      '{"revision":"x","reviewed":null}',
    ]) {
      expect(readDecisionReview(value, revision, ["purpose"])).toEqual([])
    }
  })
})
