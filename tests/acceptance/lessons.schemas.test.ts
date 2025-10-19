import { describe, it, expect } from "vitest"
import { normalizeIncomingPayload, validateFinalPayload, WizardPayloadSchema } from "@/lib/lessons/schemas"
import { LESSON_TITLE_MAX_LENGTH, LESSON_SUBTITLE_MAX_LENGTH, MODULE_TITLE_MAX_LENGTH, MODULE_SUBTITLE_MAX_LENGTH } from "@/lib/lessons/limits"

describe("Wizard payload schemas", () => {
  it("normalizes and clamps incoming payload", () => {
    const payload = {
      title: " "+"T".repeat(LESSON_TITLE_MAX_LENGTH + 50)+" ",
      subtitle: " "+"S".repeat(LESSON_SUBTITLE_MAX_LENGTH + 50)+" ",
      body: "  Hello  ",
      videoUrl: " https://example.com ",
      links: [
        { title: "  A  ", url: "  https://x.y  " },
        { title: "B", url: "", provider: "youtube" },
      ],
      modules: [
        {
          moduleId: "m1",
          title: " "+"M".repeat(MODULE_TITLE_MAX_LENGTH + 20)+" ",
          subtitle: " "+"N".repeat(MODULE_SUBTITLE_MAX_LENGTH + 20)+" ",
          body: "  Body  ",
          videoUrl: " https://videos ",
          resources: [
            { title: "  R1  ", url: "  https://notion.so  ", provider: "notion" },
          ],
          formFields: [
            { label: " Label ", type: "subtitle", required: true, placeholder: "  X  ", description: " Y " },
            { label: " Colors ", type: "multi_select", options: ["  red  ", "", " blue "] },
            { label: " Scale ", type: "slider", min: 1, max: 5, step: 1 },
            { label: " Program ", type: "custom_program", programTemplate: " template " },
          ],
        },
      ],
    }

    const normalized = normalizeIncomingPayload(payload)
    expect(normalized.title.length).toBe(LESSON_TITLE_MAX_LENGTH)
    expect(normalized.subtitle.length).toBe(LESSON_SUBTITLE_MAX_LENGTH)
    expect(normalized.videoUrl).toBe("https://example.com")
    expect(normalized.links[0].title).toBe("A")
    expect(normalized.links[0].provider).toBe("generic")
    expect(normalized.links[1].provider).toBe("youtube")

    const m = normalized.modules[0]
    expect(m.title.length).toBe(MODULE_TITLE_MAX_LENGTH)
    expect(m.subtitle.length).toBe(MODULE_SUBTITLE_MAX_LENGTH)
    expect(m.videoUrl).toBe("https://videos")

    const [f0, f1, f2, f3] = m.formFields
    expect(f0.type).toBe("subtitle")
    expect(f0.required).toBe(false)
    expect(f0.placeholder).toBeUndefined()
    expect(f1.type).toBe("multi_select")
    expect(f1.options).toEqual(["red", "blue"])
    expect(f2.type).toBe("slider")
    expect(f2.min).toBe(1)
    expect(f2.max).toBe(5)
    expect(f2.step).toBe(1)
    expect(f3.type).toBe("custom_program")
    expect(f3.programTemplate).toBe(" template ")
  })

  it("validates final payload without mutation", () => {
    const payload = WizardPayloadSchema.parse({
      title: "Title",
      subtitle: "Sub",
      body: "",
      videoUrl: "",
      links: [{ title: "A", url: "https://x" }],
      modules: [
        {
          title: "M",
          subtitle: "S",
          body: "",
          videoUrl: "",
          resources: [{ title: "R", url: "https://y", provider: "generic" }],
          formFields: [{ label: "L", type: "short_text", required: false }],
        },
      ],
    })
    const validated = validateFinalPayload(payload)
    expect(validated).toMatchObject(payload)
  })
})

