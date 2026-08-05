import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it, vi } from "vitest"

import {
  applyOrganizationSetupAcceleratorProgressOverride,
  hasSavedOrganizationSetup,
  markOrganizationSetupModuleCompleted,
  ORGANIZATION_SETUP_MODULE_SLUGS,
} from "@/lib/accelerator/organization-setup"
import type { AcceleratorProgressSummary } from "@/lib/accelerator/progress"

type OrganizationSetupSupabase = Parameters<
  typeof markOrganizationSetupModuleCompleted
>[0]["supabase"]

function buildProgressClient({
  existingProgress,
}: {
  existingProgress: { status: string; completed_at: string | null } | null
}) {
  const progressUpsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn((table: string) => {
    if (table === "modules") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              returns: vi.fn().mockResolvedValue({
                data: [
                  { id: "legacy", slug: "workspace-setup" },
                  { id: "canonical", slug: "organization-setup" },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }
    }
    if (table === "module_progress") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: existingProgress,
                error: null,
              }),
            }),
          }),
        }),
        upsert: progressUpsert,
      }
    }
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    progressUpsert,
    supabase: { from } as unknown as OrganizationSetupSupabase,
  }
}

function buildSummary(): AcceleratorProgressSummary {
  return {
    groups: [
      {
        id: "formation",
        title: "Formation",
        description: null,
        slug: "formation",
        modules: [
          {
            id: "setup",
            slug: "organization-setup",
            title: "Organization setup",
            description: null,
            href: "/accelerator/setup",
            status: "not_started",
            index: 0,
            hasNotes: false,
          },
          {
            id: "next",
            slug: "naming-your-nfp",
            title: "Naming your NFP",
            description: null,
            href: "/accelerator/naming",
            status: "in_progress",
            index: 1,
            hasNotes: false,
          },
        ],
      },
    ],
    totalModules: 2,
    completedModules: 0,
    inProgressModules: 1,
    percent: 0,
  }
}

describe("organization setup accelerator progress", () => {
  it("recognizes a saved organization as completed setup", () => {
    expect(
      hasSavedOrganizationSetup({
        organizationName: "Bright Futures",
        publicSlug: "bright-futures",
      })
    ).toBe(true)
    expect(
      hasSavedOrganizationSetup({
        organizationName: "Bright Futures",
        publicSlug: null,
      })
    ).toBe(false)
  })

  it("recovers setup completion without changing later modules", () => {
    const next = applyOrganizationSetupAcceleratorProgressOverride(
      buildSummary(),
      true
    )

    expect(next.groups[0]?.modules.map((module) => module.status)).toEqual([
      "completed",
      "in_progress",
    ])
    expect(next.completedModules).toBe(1)
    expect(next.inProgressModules).toBe(1)
    expect(next.percent).toBe(50)
  })

  it("does not infer completion before organization details are saved", () => {
    const summary = buildSummary()
    expect(
      applyOrganizationSetupAcceleratorProgressOverride(summary, false)
    ).toBe(summary)
  })

  it("writes canonical durable progress for saved organizations", async () => {
    const { progressUpsert, supabase } = buildProgressClient({
      existingProgress: null,
    })

    const result = await markOrganizationSetupModuleCompleted({
      supabase,
      userId: "affected_user",
    })

    expect(result).toEqual({
      changed: true,
      completedAt: expect.any(String),
      moduleId: "canonical",
    })
    expect(progressUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "affected_user",
        module_id: "canonical",
        status: "completed",
      }),
      { onConflict: "user_id,module_id" }
    )
  })

  it("does not rewrite an existing completion timestamp", async () => {
    const completedAt = "2026-08-01T12:00:00.000Z"
    const { progressUpsert, supabase } = buildProgressClient({
      existingProgress: { status: "completed", completed_at: completedAt },
    })

    const result = await markOrganizationSetupModuleCompleted({
      supabase,
      userId: "recovered_user",
    })

    expect(result).toEqual({
      changed: false,
      completedAt,
      moduleId: "canonical",
    })
    expect(progressUpsert).not.toHaveBeenCalled()
  })

  it("backfills owners and members without rewriting completed rows", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260805145856_reconcile_organization_setup_progress.sql"
      ),
      "utf8"
    )

    for (const slug of ORGANIZATION_SETUP_MODULE_SLUGS) {
      expect(source).toContain(`'${slug}'`)
    }
    expect(source).toContain("organization_memberships.member_id")
    expect(source).toContain("on conflict (user_id, module_id) do update")
    expect(source).toContain(
      "module_progress.status is distinct from 'completed'::module_progress_status"
    )
  })
})
