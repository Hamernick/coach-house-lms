import { describe, it, expect } from "vitest"
import { initialWizardData, wizardReducer } from "@/hooks/lessons/wizard-reducer"
import { MODULE_TITLE_MAX_LENGTH, clampText } from "@/lib/lessons/limits"

describe("wizardReducer", () => {
  it("handles link lifecycle", () => {
    let s = initialWizardData
    s = wizardReducer(s, { type: "LINK_ADD" })
    expect(s.links).toHaveLength(1)
    const id = s.links[0].id
    s = wizardReducer(s, { type: "LINK_UPDATE", payload: { id, field: "title", value: "Doc" } })
    s = wizardReducer(s, { type: "LINK_UPDATE", payload: { id, field: "url", value: "https://youtube.com/watch?v=abc" } })
    expect(s.links[0]).toMatchObject({ title: "Doc", providerSlug: "youtube" })
    s = wizardReducer(s, { type: "LINK_REMOVE", payload: { id } })
    expect(s.links).toHaveLength(0)
  })

  it("handles module lifecycle and field/resource updates", () => {
    let s = initialWizardData
    s = wizardReducer(s, { type: "MODULE_ADD" })
    expect(s.modules).toHaveLength(1)
    const longTitle = "T".repeat(MODULE_TITLE_MAX_LENGTH + 10)
    s = wizardReducer(s, { type: "MODULE_UPDATE_FIELD", payload: { index: 0, field: "title", value: longTitle } })
    expect(s.modules[0].title.length).toBe(MODULE_TITLE_MAX_LENGTH)

    // Resources
    s = wizardReducer(s, { type: "RESOURCE_ADD", payload: { moduleIndex: 0 } })
    expect(s.modules[0].resources).toHaveLength(1)
    const rid = s.modules[0].resources[0].id
    s = wizardReducer(s, { type: "RESOURCE_UPDATE", payload: { moduleIndex: 0, resourceId: rid, field: "url", value: "https://notion.so/page" } })
    expect(s.modules[0].resources[0].providerSlug).toBe("notion")
    s = wizardReducer(s, { type: "RESOURCE_REMOVE", payload: { moduleIndex: 0, resourceId: rid } })
    expect(s.modules[0].resources).toHaveLength(0)

    // Fields
    s = wizardReducer(s, { type: "FIELD_ADD", payload: { moduleIndex: 0 } })
    expect(s.modules[0].formFields).toHaveLength(1)
    const fid = s.modules[0].formFields[0].id
    s = wizardReducer(s, { type: "FIELD_UPDATE", payload: { moduleIndex: 0, fieldId: fid, apply: (f) => ({ ...f, label: "Updated" }) } })
    expect(s.modules[0].formFields[0].label).toBe("Updated")
    s = wizardReducer(s, { type: "FIELD_REMOVE", payload: { moduleIndex: 0, fieldId: fid } })
    expect(s.modules[0].formFields).toHaveLength(0)

    s = wizardReducer(s, { type: "MODULE_REMOVE", payload: { index: 0 } })
    expect(s.modules).toHaveLength(0)
  })
})

