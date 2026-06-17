import { describe, expect, it } from "vitest"

import {
  MAX_BYTES,
  MAX_UPLOAD_MB,
} from "@/components/organization/org-profile-card/tabs/documents-tab/constants"
import { validatePdf } from "@/components/organization/org-profile-card/tabs/documents-tab/helpers"

describe("organization document upload limit", () => {
  it("allows PDF uploads up to 50 MB", () => {
    expect(MAX_UPLOAD_MB).toBe(50)
    expect(MAX_BYTES).toBe(50 * 1024 * 1024)

    const file = new File(["x"], "verification.pdf", {
      type: "application/pdf",
    })
    Object.defineProperty(file, "size", {
      value: MAX_BYTES,
    })

    expect(validatePdf(file)).toBeNull()
  })

  it("returns the current 50 MB limit in validation errors", () => {
    const file = new File(["x"], "verification.pdf", {
      type: "application/pdf",
    })
    Object.defineProperty(file, "size", {
      value: MAX_BYTES + 1,
    })

    expect(validatePdf(file)).toBe("PDF must be 50 MB or less.")
  })
})
