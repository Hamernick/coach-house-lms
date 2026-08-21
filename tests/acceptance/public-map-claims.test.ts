import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  isSameOriginRequest,
  parsePublicMapClaimInput,
} from "@/features/public-map-claims"

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

describe("public-map-claims feature contract", () => {
  it("validates bounded, plain-text claim input", () => {
    const parsed = parsePublicMapClaimInput({
      claimantEmail: "person@example.org",
      claimantName: "Casey Founder",
      listingName: "Neighborhood Pantry",
      message: "I founded this nonprofit.",
      submissionKey: "f9ff4f91-a252-46aa-b19d-c7b8b8bf2021",
      targetKind: "resource_map_organization",
      targetId: "a74bfebe-7af2-4980-a371-0a7967eda380",
      website: "",
    })

    expect(parsed.success).toBe(true)
    expect(
      parsePublicMapClaimInput({
        claimantEmail: "not-an-email",
        claimantName: "C",
        listingName: "N",
        message: "x".repeat(2_001),
        submissionKey: "invalid",
        targetKind: "resource_map_organization",
        targetId: "not-a-uuid",
      }).success
    ).toBe(false)
    expect(
      parsePublicMapClaimInput({
        claimantEmail: "person@example.org",
        claimantName: "Casey Founder",
        listingName: "Neighborhood Pantry",
        submissionKey: "f9ff4f91-a252-46aa-b19d-c7b8b8bf2021",
        targetKind: "new",
        targetId: null,
      }).success
    ).toBe(false)
  })

  it("requires a same-origin browser submission", () => {
    expect(
      isSameOriginRequest(
        new Request("https://coachhouse.app/api/public/organization-claims", {
          headers: { Origin: "https://coachhouse.app" },
        })
      )
    ).toBe(true)
    expect(
      isSameOriginRequest(
        new Request("https://coachhouse.app/api/public/organization-claims", {
          headers: { Origin: "https://attacker.example" },
        })
      )
    ).toBe(false)
  })

  it("uses a service-only atomic intake with bounded abuse controls", () => {
    const migration = readSource(
      "supabase/migrations/20260821103000_add_public_map_claim_requests.sql"
    )

    expect(migration).toContain("force row level security")
    expect(migration).toContain(
      "revoke all on table public.public_map_claim_requests from public, anon, authenticated"
    )
    expect(migration).toContain(
      "create or replace function public.submit_public_map_claim_request"
    )
    expect(migration).toContain("pg_advisory_xact_lock")
    expect(migration).toContain("v_risk_hour_count >= 5")
    expect(migration).toContain("v_risk_day_count >= 10")
    expect(migration).toContain("v_email_target_day_count >= 3")
    expect(migration).toContain("from public, anon, authenticated")
    expect(migration).toContain("to service_role")
    expect(migration).not.toContain("create policy")
  })

  it("creates a generic task and notification without claim PII", () => {
    const migration = readSource(
      "supabase/migrations/20260821103000_add_public_map_claim_requests.sql"
    )
    const delivery = migration.slice(
      migration.indexOf(
        "create or replace function public.deliver_public_map_claim_request"
      )
    )

    expect(delivery).toContain("Review public map claim request")
    expect(delivery).toContain("New public map claim request")
    expect(delivery).toContain("Public Map Claims")
    expect(delivery).toContain("platform:public-map-claims")
    expect(delivery).toContain("public_map_claim")
    expect(delivery).not.toContain("v_claim.claimant_email")
    expect(delivery).not.toContain("v_claim.claimant_name")
    expect(delivery).not.toContain("v_claim.message")
  })

  it("keeps the public form dismissible and the admin queue access-gated", () => {
    const dialog = readSource(
      "src/features/public-map-claims/components/public-map-claim-dialog.tsx"
    )
    const loader = readSource(
      "src/features/public-map-claims/server/loaders.ts"
    )
    const route = readSource("src/app/api/public/organization-claims/route.ts")
    const search = readSource("src/features/public-map-claims/server/search.ts")
    const submission = readSource(
      "src/features/public-map-claims/server/submission.ts"
    )

    expect(dialog).toContain("closeButton: true")
    expect(dialog).toContain("Discard this request?")
    expect(dialog).toContain("Claim a listing")
    expect(dialog).toContain('href="/sign-up?intent=build&source=find_claim"')
    expect(dialog).toContain("?query=${encodeURIComponent(query)}")
    expect(dialog).not.toContain("Add a missing nonprofit")
    expect(search).toContain('.from("resource_map_public_items")')
    expect(search).toContain('.is("platform_org_id", null)')
    expect(search).toContain('.not("source_label", "is", null)')
    expect(submission).toContain('.from("resource_map_public_items")')
    expect(submission).toContain('.is("platform_org_id", null)')
    expect(submission).toContain('.not("source_label", "is", null)')
    expect(loader).toContain("await requireAdmin()")
    expect(route).toContain("MAX_BODY_BYTES = 16_384")
    expect(route).toContain('"Retry-After"')
  })
})
