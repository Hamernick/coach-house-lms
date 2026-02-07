import { describe, expect, it } from "vitest"

import type { ModuleRecord } from "@/lib/modules"
import { buildModuleStates } from "@/lib/module-progress"

describe("module availability", () => {
  const baseModule = (id: string, idx: number, overrides: Partial<ModuleRecord> = {}): ModuleRecord => ({
    id,
    idx,
    slug: `module-${id}`,
    title: `Module ${idx}`,
    description: null,
    videoUrl: null,
    contentMd: null,
    durationMinutes: null,
    published: true,
    hasDeck: false,
    resources: [],
    assignment: null,
    assignmentSubmission: null,
    ...overrides,
  })

  it("does not lock subsequent modules when predecessors are incomplete", () => {
    const modules = [baseModule("two", 2), baseModule("one", 1, { hasDeck: true })]

    const states = buildModuleStates(modules, {
      one: "not_started",
    })

    expect(states).toHaveLength(2)
    expect(states[0].module.id).toBe("one")
    expect(states[0].locked).toBe(false)
    expect(states[0].completed).toBe(false)
    expect(states[1].module.id).toBe("two")
    expect(states[1].locked).toBe(false)
  })

  it("keeps later modules available when prior modules are completed", () => {
    const modules = [baseModule("one", 1), baseModule("two", 2)]

    const states = buildModuleStates(modules, {
      one: "completed",
    })

    expect(states[0].locked).toBe(false)
    expect(states[1].locked).toBe(false)
    expect(states[1].status).toBe("not_started")
  })
})
