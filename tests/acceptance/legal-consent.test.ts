import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  createSignupLegalConsent,
  isCurrentSignupLegalConsent,
  PRIVACY_DOCUMENT,
  TERMS_DOCUMENT,
} from "@/features/legal-consent"
import { signUpSchema } from "@/components/auth/sign-up-form-schema"

function contentHash(document: typeof TERMS_DOCUMENT) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: document.title,
        description: document.description,
        version: document.version,
        sections: document.sections,
      })
    )
    .digest("hex")
}

describe("legal consent", () => {
  it("requires explicit acceptance during signup", () => {
    const rejected = signUpSchema.safeParse({
      email: "member@example.test",
      password: "password123",
      confirmPassword: "password123",
      acceptedLegal: false,
    })
    expect(rejected.success).toBe(false)

    expect(
      signUpSchema.safeParse({
        email: "member@example.test",
        password: "password123",
        confirmPassword: "password123",
        acceptedLegal: true,
      }).success
    ).toBe(true)
  })

  it("binds acceptance to the exact document content", () => {
    expect(TERMS_DOCUMENT.sha256).toBe(contentHash(TERMS_DOCUMENT))
    expect(PRIVACY_DOCUMENT.sha256).toBe(contentHash(PRIVACY_DOCUMENT))
    expect(createSignupLegalConsent(new Date("2026-08-11T20:00:00Z"))).toEqual({
      version: TERMS_DOCUMENT.version,
      termsSha256: TERMS_DOCUMENT.sha256,
      privacySha256: PRIVACY_DOCUMENT.sha256,
      acceptedAt: "2026-08-11T20:00:00.000Z",
    })
    expect(
      isCurrentSignupLegalConsent({
        ...createSignupLegalConsent(),
        termsSha256: "0".repeat(64),
      })
    ).toBe(false)
  })

  it("stores immutable user-linked acceptance with own-row read access", () => {
    const migration = readFileSync(
      "supabase/migrations/20260811160000_add_signup_legal_acceptances.sql",
      "utf8"
    )
    expect(migration).toContain("references auth.users(id) on delete cascade")
    expect(migration).toContain("unique (user_id, document_version)")
    expect(migration).toContain(
      "alter table public.platform_legal_acceptances enable row level security"
    )
    expect(migration).toContain(
      "revoke all on public.platform_legal_acceptances from anon, authenticated"
    )
    expect(migration).toContain("using ((select auth.uid()) = user_id)")
    expect(migration).toContain("after insert on auth.users")
    expect(migration).toContain(
      `consent ->> 'version' = '${TERMS_DOCUMENT.version}'`
    )
    expect(migration).toContain(
      `consent ->> 'termsSha256' = '${TERMS_DOCUMENT.sha256}'`
    )
    expect(migration).toContain(
      `consent ->> 'privacySha256' = '${PRIVACY_DOCUMENT.sha256}'`
    )

    const testerAction = readFileSync(
      "src/app/(auth)/tester/sign-up/actions.ts",
      "utf8"
    )
    expect(testerAction).toContain("isCurrentSignupLegalConsent")
    expect(testerAction).toContain("ignoreDuplicates: true")
    expect(testerAction).toContain("accepted_at: new Date().toISOString()")
  })
})
