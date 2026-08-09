import { readFileSync } from "node:fs"
import { join } from "node:path"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PageHealthMonitorPanel } from "@/features/page-health-monitor"
import {
  buildPageHealthMonitorInput,
  normalizePageHealthEventInput,
  sanitizePageHealthPath,
} from "@/features/page-health-monitor/lib"
import type {
  PageHealthIdentity,
  PageHealthRawEvent,
} from "@/features/page-health-monitor/types"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

function event(overrides: Partial<PageHealthRawEvent>): PageHealthRawEvent {
  return {
    duration_ms: null,
    error_digest: null,
    error_message: null,
    error_name: null,
    event_type: "route_error",
    id: overrides.id ?? "event-1",
    metadata: {},
    occurred_at: overrides.occurred_at ?? "2026-07-07T19:00:00.000Z",
    org_id: overrides.org_id ?? "org-1",
    route_path: overrides.route_path ?? "/workspace",
    severity: overrides.severity ?? "critical",
    source: overrides.source ?? "client",
    stack_hash: null,
    target_href: null,
    threshold_ms: null,
    user_id: overrides.user_id ?? "user-1",
    ...overrides,
  }
}

describe("page-health-monitor feature contract", () => {
  it("normalizes page-health payloads and redacts sensitive metadata", () => {
    const normalized = normalizePageHealthEventInput({
      durationMs: 4219.4,
      errorMessage:
        "Failed at https://coachhouse.app/workspace?invite=secret#token with token=abc.",
      eventType: "slow_page_load",
      metadata: {
        authToken: "secret",
        email: "user@example.com",
        safeMessage: "Loaded https://coachhouse.app/find?token=abc#invite",
        nested: {
          inviteUrl: "https://example.com/invite?token=abc",
          recoveryCode: "code=123",
          safeValue: "kept",
        },
        viewport: { width: 1280 },
      },
      routePath: "/workspace?token=abc",
      severity: "warning",
      source: "client",
      targetHref: "https://coachhouse.app/find?invite=abc#secret",
    })

    expect(normalized.eventType).toBe("slow_page_load")
    expect(normalized.durationMs).toBe(4219)
    expect(normalized.routePath).toBe("/workspace")
    expect(normalized.targetHref).toBe("/find")
    expect(normalized.errorMessage).toBe(
      "Failed at /workspace with token=[redacted]."
    )
    expect(normalized.metadata).toMatchObject({
      nested: { safeValue: "kept" },
      safeMessage: "Loaded /find",
      viewport: { width: 1280 },
    })
    expect(JSON.stringify(normalized.metadata)).not.toContain("user@example")
    expect(JSON.stringify(normalized.metadata)).not.toContain("secret")
    expect(JSON.stringify(normalized.metadata)).not.toContain("invite")
    expect(JSON.stringify(normalized.metadata)).not.toContain("code=123")
  })

  it("strips query strings and hashes from page-health paths", () => {
    expect(sanitizePageHealthPath("/workspace?token=abc#invite")).toBe(
      "/workspace"
    )
    expect(
      sanitizePageHealthPath("https://coachhouse.app/find?invite=abc#secret")
    ).toBe("/find")
    expect(sanitizePageHealthPath("javascript:alert(1)")).toBeNull()
  })

  it("builds summary and affected-account queues from raw events", () => {
    const userIdentities = new Map<string, PageHealthIdentity>([
      [
        "user-1",
        { detail: "founder@example.com", id: "user-1", label: "Founder" },
      ],
    ])
    const orgIdentities = new Map<string, PageHealthIdentity>([
      ["org-1", { detail: null, id: "org-1", label: "Northside Lab" }],
    ])

    const input = buildPageHealthMonitorInput({
      generatedAt: "2026-07-07T20:00:00.000Z",
      orgIdentities,
      rawEvents: [
        event({ id: "critical", severity: "critical" }),
        event({
          duration_ms: 12800,
          event_type: "stuck_page_load",
          id: "stuck",
          severity: "critical",
        }),
        event({
          event_type: "unhandled_rejection",
          id: "warning",
          severity: "warning",
        }),
      ],
      userIdentities,
    })

    expect(input.summary).toMatchObject({
      affectedOrgs: 1,
      affectedUsers: 1,
      criticalEvents: 2,
      slowEvents: 1,
      totalEvents: 3,
      warningEvents: 1,
    })
    expect(input.affectedAccounts[0]).toMatchObject({
      criticalCount: 2,
      eventCount: 3,
      orgLabel: "Northside Lab",
      userLabel: "Founder",
    })
  })

  it("renders the super-admin monitor states", () => {
    const input = buildPageHealthMonitorInput({
      generatedAt: "2026-07-07T20:00:00.000Z",
      orgIdentities: new Map([
        ["org-1", { detail: null, id: "org-1", label: "Northside Lab" }],
      ]),
      rawEvents: [
        event({
          error_message: "Workspace failed to load",
          id: "event-render",
        }),
      ],
      userIdentities: new Map([
        ["user-1", { detail: null, id: "user-1", label: "Founder" }],
      ]),
    })

    const markup = renderToStaticMarkup(
      React.createElement(PageHealthMonitorPanel, { input })
    )

    expect(markup).toContain("Page health monitor")
    expect(markup).toContain("Affected accounts")
    expect(markup).toContain("Recent page events")
    expect(markup).toContain("Workspace failed to load")
    expect(markup).toContain("Northside Lab")
  })

  it("stores page-health events with admin-only read policy", () => {
    const migration = readSource(
      "supabase/migrations/20260707210000_add_app_page_health_events.sql"
    )
    const schemaIndex = readSource("src/lib/supabase/schema/tables/index.ts")
    const schemaTable = readSource(
      "src/lib/supabase/schema/tables/app_page_health_events.ts"
    )

    expect(migration).toContain(
      "create table if not exists public.app_page_health_events"
    )
    expect(migration).toContain("enable row level security")
    expect(migration).toContain("force row level security")
    expect(migration).toContain(
      "revoke all on table public.app_page_health_events from anon, authenticated"
    )
    expect(migration).toContain(
      "grant select on table public.app_page_health_events"
    )
    expect(migration).toContain("app_page_health_events_admin_read")
    expect(migration).toContain("using (public.is_admin())")
    expect(migration).toContain("notify pgrst, 'reload schema'")
    expect(schemaIndex).toContain("AppPageHealthEventsTable")
    expect(schemaIndex).toContain(
      "app_page_health_events: AppPageHealthEventsTable"
    )
    expect(schemaTable).toContain("event_type: string")
    expect(schemaTable).toContain("metadata: Json")
  })

  it("wires capture through provider, endpoint, and error boundaries", () => {
    const provider = readSource("src/components/providers/app-providers.tsx")
    const apiRoute = readSource("src/app/api/telemetry/page-health/route.ts")
    const reporter = readSource(
      "src/components/providers/page-health-reporter.tsx"
    )
    const dashboardError = readSource("src/app/(dashboard)/error.tsx")
    const appError = readSource("src/app/error.tsx")
    const globalError = readSource("src/app/global-error.tsx")

    expect(provider).toContain("<PageHealthReporter />")
    expect(apiRoute).toContain("resolveOptionalAuthenticatedAppContext")
    expect(apiRoute).toContain("recordPageHealthEvent")
    expect(apiRoute).toContain("status: 202")
    expect(reporter).toContain("/api/telemetry/page-health")
    expect(reporter).toContain("navigator.sendBeacon")
    expect(reporter).toContain("hashString")
    expect(reporter).not.toContain("window.location.search")
    expect(reporter).not.toContain("window.location.hash")
    expect(reporter).toContain("sanitizePageHealthPath(window.location.href)")
    expect(apiRoute).toContain("MAX_PAGE_HEALTH_PAYLOAD_BYTES")
    expect(apiRoute).toContain("isAllowedPageHealthOrigin")
    expect(apiRoute).toContain('reason: "origin_not_allowed"')
    expect(apiRoute).toContain('reason: "payload_too_large"')
    expect(dashboardError).toContain("reportPageHealthError")
    expect(appError).toContain('source: "error_boundary"')
    expect(globalError).toContain('eventType: "global_error"')
  })

  it("exposes the monitor only through the super-admin prototype route", () => {
    const page = readSource(
      "src/app/(admin)/admin/platform/prototypes/page.tsx"
    )
    const entries = readSource("src/features/prototype-lab/lib/index.ts")
    const sidebar = readSource("src/features/prototype-lab/lib/sidebar-tree.ts")
    const panel = readSource(
      "src/features/prototype-lab/components/prototype-lab-panel.tsx"
    )

    expect(page).toContain("await requireAdmin()")
    expect(page).toContain("getPageHealthMonitorPageInput")
    expect(page).toContain("PageHealthMonitorPanel")
    expect(entries).toContain('id: "page-health-monitor"')
    expect(entries).toContain('folderLabel: "Operations"')
    expect(sidebar).toContain("?entry=page-health-monitor")
    expect(panel).toContain('entryId === "page-health-monitor"')
  })
})
