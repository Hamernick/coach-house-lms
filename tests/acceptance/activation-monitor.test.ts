import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { describe, expect, it, vi } from "vitest"

import {
  ActivationMonitorPanel,
  buildActivationMonitorInput,
} from "@/features/activation-monitor"

describe("activation-monitor feature contract", () => {
  it("aggregates activation checkpoints into funnel counts and stuck paths", () => {
    const input = buildActivationMonitorInput({
      generatedAt: "2026-05-13T05:40:00.000Z",
      events: [
        {
          id: "event-1",
          user_id: "user-a",
          org_id: "org-a",
          event_name: "checkout_started",
          journey: "paid_builder",
          source: "stripe_checkout_route",
          surface: "pricing_checkout",
          plan_tier: "organization",
          occurred_at: "2026-05-13T05:01:00.000Z",
        },
        {
          id: "event-2",
          user_id: "user-a",
          org_id: "org-a",
          event_name: "checkout_completed",
          journey: "paid_builder",
          source: "pricing_success_page",
          surface: "pricing_success",
          plan_tier: "organization",
          occurred_at: "2026-05-13T05:05:00.000Z",
        },
        {
          id: "event-3",
          user_id: "user-b",
          org_id: "org-b",
          event_name: "checkout_started",
          journey: "paid_builder",
          source: "stripe_checkout_route",
          surface: "pricing_checkout",
          plan_tier: "operations_support",
          occurred_at: "2026-05-13T05:06:00.000Z",
        },
      ],
      checkpoints: [
        {
          id: "checkpoint-1",
          user_id: "user-a",
          org_id: "org-a",
          checkpoint: "checkout_started",
          completed_at: "2026-05-13T05:01:00.000Z",
        },
        {
          id: "checkpoint-2",
          user_id: "user-a",
          org_id: "org-a",
          checkpoint: "paid_plan_confirmed",
          completed_at: "2026-05-13T05:05:00.000Z",
        },
        {
          id: "checkpoint-3",
          user_id: "user-a",
          org_id: "org-a",
          checkpoint: "account_onboarding_completed",
          completed_at: "2026-05-13T05:10:00.000Z",
        },
        {
          id: "checkpoint-4",
          user_id: "user-a",
          org_id: "org-a",
          checkpoint: "workspace_first_viewed",
          completed_at: "2026-05-13T05:12:00.000Z",
        },
        {
          id: "checkpoint-5",
          user_id: "user-b",
          org_id: "org-b",
          checkpoint: "checkout_started",
          completed_at: "2026-05-13T05:06:00.000Z",
        },
        {
          id: "checkpoint-6",
          user_id: "user-c",
          org_id: "org-c",
          checkpoint: "first_organization_invite_sent",
          completed_at: "2026-05-13T05:08:00.000Z",
        },
      ],
    })

    expect(input.summary).toMatchObject({
      totalEvents: 3,
      totalCheckpoints: 6,
      uniqueUsers: 3,
      uniqueOrgs: 3,
      attentionCount: 3,
    })
    expect(input.funnelStages.map((stage) => [stage.id, stage.count])).toEqual([
      ["checkout_started", 2],
      ["paid_plan_confirmed", 1],
      ["account_onboarding_completed", 1],
      ["workspace_first_viewed", 1],
      ["first_homework_submitted", 0],
      ["first_coaching_schedule_opened", 0],
    ])
    expect(input.funnelStages[1].conversionFromPrevious).toBe(50)
    expect(input.attentionItems.map((item) => item.missingCheckpoint)).toEqual([
      "paid_plan_confirmed",
      "first_homework_submitted",
      "first_invite_accepted",
    ])
    expect(input.coverageItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: "checkout_started",
          eventCount: 2,
          checkpointCount: 2,
          status: "capturing",
        }),
        expect.objectContaining({
          eventName: "homework_submitted",
          eventCount: 0,
          checkpointCount: 0,
          status: "missing",
        }),
      ]),
    )
  })

  it("renders an operations dashboard without relying on translucent panels", () => {
    const input = buildActivationMonitorInput({
      generatedAt: "2026-05-13T05:40:00.000Z",
      events: [],
      checkpoints: [],
    })
    const markup = renderToStaticMarkup(
      createElement(ActivationMonitorPanel, { input }),
    )
    const source = readFileSync(
      "src/features/activation-monitor/components/activation-monitor-panel.tsx",
      "utf8",
    )

    expect(markup).toContain("Activation monitor")
    expect(markup).toContain("Activation funnel")
    expect(markup).toContain("Attention queue")
    expect(markup).toContain("Telemetry coverage")
    expect(markup).toContain("Latest events")
    expect(markup).toContain("No telemetry events captured in this window.")
    expect(source).toContain("border bg-card")
    expect(source).toContain("tabular-nums")
    expect(source).not.toMatch(/bg-[A-Za-z0-9_-]+\/\d/)
    expect(source).not.toContain("backdrop-blur")
  })

  it("is mounted as a Prototypes user-journey operations entry", () => {
    const prototypeLabSource = readFileSync(
      "src/features/prototype-lab/lib/index.ts",
      "utf8",
    )
    const sidebarSource = readFileSync(
      "src/features/prototype-lab/lib/sidebar-tree.ts",
      "utf8",
    )
    const pageSource = readFileSync(
      "src/app/(admin)/admin/platform/prototypes/page.tsx",
      "utf8",
    )

    expect(prototypeLabSource).toContain('id: "activation-monitor"')
    expect(prototypeLabSource).toContain('folderLabel: "Operations"')
    expect(sidebarSource).toContain("user-journeys:operations")
    expect(sidebarSource).toContain("PROTOTYPE_LAB_BASE_PATH")
    expect(sidebarSource).toContain("?entry=activation-monitor")
    expect(pageSource).toContain("getActivationMonitorPageInput")
    expect(pageSource).toContain("ActivationMonitorPanel")
    expect(pageSource).toContain("await requireAdmin()")
  })

  it("shows a migration-pending state for Supabase schema-cache misses", async () => {
    vi.resetModules()
    vi.doMock("@/lib/supabase/admin", () => ({
      createSupabaseAdminClient: () => ({
        from: (table: string) => {
          const query = {
            select: () => query,
            gte: () => query,
            order: () => query,
            limit: () => query,
            returns: async () => ({
              data: null,
              error: {
                code: "PGRST205",
                message: `Could not find the table 'public.${table}' in the schema cache`,
              },
            }),
          }
          return query
        },
      }),
    }))

    const { getActivationMonitorPageInput } = await import(
      "@/features/activation-monitor/server/queries"
    )
    const input = await getActivationMonitorPageInput()

    expect(input.status).toBe("unavailable")
    expect(input.statusMessage).toContain("Telemetry migration pending")
    expect(input.statusMessage).not.toContain("Could not find the table")

    vi.doUnmock("@/lib/supabase/admin")
    vi.resetModules()
  })
})
