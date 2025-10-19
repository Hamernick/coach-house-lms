import { describe, it, expect } from "vitest"
import { toNumberOrNull, normalizeFormFieldTypeLegacy } from "@/lib/lessons/fields"

describe("lessons fields helpers", () => {
  it("toNumberOrNull handles edge cases", () => {
    expect(toNumberOrNull("" as unknown)).toBeNull()
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull("123")).toBe(123)
    expect(toNumberOrNull("12.5")).toBe(12.5)
    expect(toNumberOrNull("abc")).toBeNull()
  })

  it("normalizeFormFieldTypeLegacy maps legacy aliases", () => {
    expect(normalizeFormFieldTypeLegacy("text")).toBe("short_text")
    expect(normalizeFormFieldTypeLegacy("textarea")).toBe("long_text")
    expect(normalizeFormFieldTypeLegacy("program_builder")).toBe("custom_program")
    expect(normalizeFormFieldTypeLegacy("display", "subtitle")).toBe("subtitle")
    expect(normalizeFormFieldTypeLegacy("subtitle")).toBe("subtitle")
    expect(normalizeFormFieldTypeLegacy("select")).toBe("select")
    expect(normalizeFormFieldTypeLegacy("multi_select")).toBe("multi_select")
    expect(normalizeFormFieldTypeLegacy("slider")).toBe("slider")
  })
})

