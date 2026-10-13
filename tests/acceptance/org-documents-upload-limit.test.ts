import { describe, expect, it } from "vitest"

import {
  MAX_BYTES,
  MAX_UPLOAD_MB,
} from "@/components/organization/org-profile-card/tabs/documents-tab/constants"
import { validatePdf } from "@/components/organization/org-profile-card/tabs/documents-tab/helpers"

describe("organization document upload limit", () => {
  it("allows PDF uploads up to the existing 15 MB bucket limit", () => {
    expect(MAX_UPLOAD_MB).toBe(15)
    expect(MAX_BYTES).toBe(15 * 1024 * 1024)

    const file = new File(["x"], "verification.pdf", {
      type: "application/pdf",
    })
    Object.defineProperty(file, "size", {
      value: MAX_BYTES,
    })

    expect(validatePdf(file)).toBeNull()
  })

  it("returns the current 15 MB limit in validation errors", () => {
    const file = new File(["x"], "verification.pdf", {
      type: "application/pdf",
    })
    Object.defineProperty(file, "size", {
      value: MAX_BYTES + 1,
    })

    expect(validatePdf(file)).toBe("PDF must be 15 MB or less.")
  })
})
