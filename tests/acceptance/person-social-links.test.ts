import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  findPersonSocialLinkError,
  getPersonSocialLinkError,
  normalizePersonSocialLinks,
  readPersonSocialLinks,
  resolvePersonSocialHref,
} from "@/lib/people/social-links"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("person social links", () => {
  it("normalizes every supported social field", () => {
    expect(
      readPersonSocialLinks({
        linkedin: " https://linkedin.com/in/person ",
        instagram: "@person",
      })
    ).toEqual({
      facebook: "",
      instagram: "@person",
      linkedin: "https://linkedin.com/in/person",
      tiktok: "",
      twitter: "",
      youtube: "",
    })
  })

  it("preserves omitted social fields during partial person updates", () => {
    expect(
      normalizePersonSocialLinks(
        { instagram: "new-profile" },
        { linkedin: "existing-profile", instagram: "old-profile" }
      )
    ).toMatchObject({
      instagram: "new-profile",
      linkedin: "existing-profile",
    })

    expect(
      normalizePersonSocialLinks(
        { linkedin: "updated-linkedin" },
        {
          facebook: "hidden-facebook",
          instagram: "hidden-instagram",
          linkedin: "old-linkedin",
          tiktok: "hidden-tiktok",
          twitter: "hidden-twitter",
          youtube: "hidden-youtube",
        }
      )
    ).toEqual({
      facebook: "hidden-facebook",
      instagram: "hidden-instagram",
      linkedin: "updated-linkedin",
      tiktok: "hidden-tiktok",
      twitter: "hidden-twitter",
      youtube: "hidden-youtube",
    })
  })

  it("resolves full URLs and platform handles", () => {
    expect(resolvePersonSocialHref("twitter", "@coachhouse")).toBe(
      "https://x.com/coachhouse"
    )
    expect(resolvePersonSocialHref("linkedin", "company/coach-house")).toBe(
      "https://www.linkedin.com/company/coach-house"
    )
    expect(
      resolvePersonSocialHref("instagram", "https://instagram.com/coachhouse")
    ).toBe("https://instagram.com/coachhouse")
  })

  it("rejects mismatched domains and unsafe schemes", () => {
    expect(
      resolvePersonSocialHref("linkedin", "https://instagram.com/not-linkedin")
    ).toBe("")
    expect(resolvePersonSocialHref("instagram", "javascript:alert(1)")).toBe("")
    expect(
      resolvePersonSocialHref("twitter", "https://twitter.com/person")
    ).toBe("https://twitter.com/person")
  })

  it("returns platform-specific validation errors", () => {
    expect(
      getPersonSocialLinkError("linkedin", "https://instagram.com/not-linkedin")
    ).toBe("Enter a valid LinkedIn profile URL or handle.")
    expect(
      getPersonSocialLinkError("linkedin", "company/coach-house")
    ).toBeNull()
    expect(
      findPersonSocialLinkError({
        instagram: "https://example.com/not-instagram",
      })
    ).toBe("Enter a valid Instagram profile URL or handle.")
    expect(findPersonSocialLinkError({ linkedin: undefined })).toBeNull()
  })

  it("enforces link safety in saves, fields, and rendered platform badges", () => {
    const actionSource = readSource("src/actions/people.ts")
    const dialogSource = readSource(
      "src/components/people/create-person-dialog.tsx"
    )
    const fieldsSource = readSource(
      "src/components/people/person-profile-form-fields.tsx"
    )
    const tableSource = readSource("src/components/people/people-table.tsx")
    const tableColumnsSource = readSource(
      "src/components/people/people-table-columns.tsx"
    )
    expect(actionSource).toContain("findPersonSocialLinkError(person)")
    expect(
      actionSource.indexOf("findPersonSocialLinkError(person)")
    ).toBeLessThan(actionSource.indexOf('requireServerSession("/people")'))
    expect(dialogSource).toContain("!socialLinkError")
    expect(dialogSource).toContain("extendedSocialLinksEnabled = false")
    expect(dialogSource).toContain(": { linkedin: socialLinks.linkedin }")
    expect(fieldsSource).toContain("aria-invalid={Boolean(linkError)}")
    expect(fieldsSource).toContain("{linkError ? (")
    expect(fieldsSource).toContain("{extendedSocialLinksEnabled ? (")
    expect(fieldsSource).toContain("{!extendedSocialLinksEnabled ? (")
    expect(actionSource).toContain("EXTENDED_PERSON_SOCIAL_PLATFORMS")
    expect(actionSource).toContain("extendedSocialWriteRequested &&")
    expect(tableSource).not.toContain("linkedin: person.linkedin ?? null")
    expect(tableSource).toContain("refreshPersonLinkedInImageAction")
    expect(tableColumnsSource).toContain("Refresh LinkedIn photo")
    expect(actionSource).toContain("fetchLinkedInProfileImage(person.linkedin)")
    expect(actionSource).not.toContain("async function fetchLinkedInImage(")
  })
})
