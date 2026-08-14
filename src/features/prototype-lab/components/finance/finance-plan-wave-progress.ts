import type { FinancePlanWorkState } from "./finance-release-plan-data"

export type FinancePlanWaveStatus =
  | "active"
  | "code_complete"
  | "preview_verified"
  | "production_verified"
  | "queued"

export type FinancePlanWaveCriterion = {
  evidence: readonly string[]
  id: string
  state: FinancePlanWorkState
  title: string
}

export type FinancePlanWave = {
  criteria: readonly FinancePlanWaveCriterion[]
  id: string
  sequence: number
  status: FinancePlanWaveStatus
  title: string
}

function defineCriteria(
  waveSequence: number,
  criteria: readonly Omit<FinancePlanWaveCriterion, "id">[]
): FinancePlanWaveCriterion[] {
  return criteria.map((criterion, index) => ({
    ...criterion,
    id: `wave-${waveSequence}-criterion-${index + 1}`,
  }))
}

export const FINANCE_PLAN_WAVES: readonly FinancePlanWave[] = [
  {
    id: "wave-1-live-stability",
    sequence: 1,
    status: "production_verified",
    title: "Live stability and existing work close",
    criteria: defineCriteria(1, [
      {
        evidence: ["PR #132 merged and production-verified"],
        state: "complete",
        title:
          "Verify authenticated Find in light and dark mode on desktop and mobile with no contrast regression",
      },
      {
        evidence: ["PR #133 merged and production-verified"],
        state: "complete",
        title:
          "Verify organization detail rendering and recoverable missing Stripe-subscription links in production",
      },
      {
        evidence: ["PR #134 merged and production-verified"],
        state: "complete",
        title:
          "Verify revision-safe organization document writes and storage rollback behavior",
      },
      {
        evidence: [
          "PRs #135 and #136 merged with authenticated production read-safety proof",
        ],
        state: "complete",
        title:
          "Verify Workspace, Roadmap, and People reads preserve stored organization data",
      },
      {
        evidence: [
          "PRs #137 and #138 merged; authenticated production Workspace save, refresh, role-journey, and restoration proof passed",
        ],
        state: "complete",
        title:
          "Complete revision-aware Workspace save smoke and the paid, free, member, coach, and admin journey matrix",
      },
    ]),
  },
  {
    id: "wave-2-signup-legal",
    sequence: 2,
    status: "active",
    title: "Signup, recovery, and legal",
    criteria: defineCriteria(2, [
      {
        evidence: [
          "PR #156 merged as 9cacf375; both production projects deployed canonical version 2026-08-12.1 pages and the 43-test signup matrix proves required acceptance across direct and contextual entry surfaces",
        ],
        state: "complete",
        title:
          "Provide canonical Terms and Privacy pages with required acceptance on every signup surface",
      },
      {
        evidence: [
          "Migration 20260811160000 is applied in production; the table exists with zero rows, public-schema lint passes, and anonymous reads return 401; one controlled signup record remains",
        ],
        state: "in_progress",
        title:
          "Persist immutable consent version, content hashes, user, and UTC acceptance time under RLS",
      },
      {
        evidence: [
          "43 focused acceptance tests pass across direct signup, contextual entry, denial, confirmation redirects, safe return, retry, and password recovery; hosted and production proof remain",
        ],
        state: "in_progress",
        title:
          "Verify direct and contextual signup, email verification, safe return, denial, retry, and recovery",
      },
      {
        evidence: [
          "The product owner reported legal review complete and the current copy approved for release on 2026-08-12",
        ],
        state: "complete",
        title: "Obtain qualified legal approval for Terms and Privacy copy",
      },
      {
        evidence: [
          "PR #156, main CI, both production deployments, canonical route probes, migration parity, schema lint, and anonymous denial pass; controlled signup smoke and tested rollback remain",
        ],
        state: "in_progress",
        title:
          "Merge, deploy, production-smoke, monitor, and retain a tested signup rollback",
      },
    ]),
  },
  {
    id: "wave-3-find-performance",
    sequence: 3,
    status: "active",
    title: "/find speed and loading",
    criteria: defineCriteria(3, [
      {
        evidence: [
          "PRs #143-#146 merged through production commit 648b0885; the live anonymous index returned all 853 records in compact responses of 25,990-97,986 bytes",
        ],
        state: "complete",
        title:
          "Serve a compact anonymous resource index without private or detail-only fields",
      },
      {
        evidence: [
          "Production returned all 853 unique records exactly once across five stable cursor pages of 200/200/200/200/53 records; Find visibly progressed from 618 to 871 combined results without losing map or directory context",
        ],
        state: "complete",
        title:
          "Add bounded or paginated loading with stable cached refresh behavior",
      },
      {
        evidence: [
          "The live exact-item endpoint returned the selected index ID in a 2,783-byte sanitized response; focused selection and refresh coverage proves later-page records remain resolvable during progressive reconciliation",
        ],
        state: "complete",
        title:
          "Load resource details on demand while preserving selected and collected records outside current bounds",
      },
      {
        evidence: [
          "PR #148 merged through production commit a149d763; focused component coverage passed 51/51 for loading, empty, unavailable, offline, stale, reconnect, and retry states while retaining the map shell",
        ],
        state: "complete",
        title:
          "Verify loading, empty, error, offline, stale, and retry states without losing map context",
      },
      {
        evidence: [
          "Production /find preserved the 1,900 KB route budget and reached 1.7s first contentful paint, but the bounded mobile Lighthouse run measured 4.7s LCP and 35.0s time to interactive with Mapbox script evaluation dominating main-thread work; focused correction and production rerun remain",
        ],
        state: "in_progress",
        title:
          "Meet payload, first-useful-render, LCP, and interaction budgets in preview and production",
      },
    ]),
  },
  {
    id: "wave-4-my-map",
    sequence: 4,
    status: "active",
    title: "Collect and My Map completion",
    criteria: defineCriteria(4, [
      {
        evidence: [
          "PR #158 merged as 8f5196ab; main quality and deployment passed, production /find returned 200, and focused plus full release gates cover local collect, remove, persistence, and hydration",
        ],
        state: "complete",
        title:
          "Let visitors collect and remove nonprofits and resources locally",
      },
      {
        evidence: [
          "PR #159 merged as 6b2ac883; production Builder/admin collect survived reload, appeared in My Map, removed cleanly, and remained removed after reload; one independent second-client observation remains",
        ],
        state: "in_progress",
        title:
          "Persist signed-in collections across devices with safe idempotent replay",
      },
      {
        evidence: [
          "PR #158 extended the existing saved-organization rail and drawer for nonprofits and resources while retaining shared account and navigation behavior and adding no Finder onboarding",
        ],
        state: "complete",
        title:
          "Build My Map on the existing saved-organization foundation without separate Finder onboarding",
      },
      {
        evidence: [
          "PR #160 merged as ae0deda7; both production deployments passed, production My Map retained the collection through progressive reload, and focused plus full acceptance cover loading, empty, stale, error, retry, and confirmed unpublishing",
        ],
        state: "complete",
        title:
          "Keep collected records resolvable through loading, empty, stale, and error states",
      },
      {
        evidence: [
          "Guest acceptance and production route proof pass; an authenticated Builder/admin completed a reversible production collect-reload-remove journey, all RLS suites pass, application console errors are empty, both deployments succeeded, and exact revert commits are recorded",
        ],
        state: "complete",
        title:
          "Verify guest, account, and Builder journeys with RLS, production monitoring, and rollback proof",
      },
    ]),
  },
  {
    id: "wave-5-finance-reporting",
    sequence: 5,
    status: "active",
    title: "Finance reporting completion",
    criteria: defineCriteria(5, [
      {
        evidence: [
          "PR #121 released bounded read-only Stripe activity and source-labeled records; PR #162 merged as 09810abd, main quality passed, both Vercel production deployments succeeded, and 70 focused Finance tests cover the released read-only source and freshness states",
        ],
        state: "complete",
        title:
          "Connect read-only external activity with explicit source and freshness labels",
      },
      {
        evidence: [
          "PR #121 merged as a6016231 and deployed to both production projects; the source-composition rail exposes an accessible description plus visible labeled amounts, focused coverage passes, and authenticated production verification opened Activity and History",
        ],
        state: "complete",
        title:
          "Provide a simple accessible graph, text equivalent, Activity list, and History",
      },
      {
        evidence: [
          "Merged reporting counts only verified, non-corrected USD inflows while retaining corrected originals and replacements in History; immutable correction storage, organization-scoped reads, focused correction coverage, and connected Finance RLS passed with PR #121 and production deployment",
        ],
        state: "complete",
        title:
          "Reconcile visible reporting to authorized external records and correction history",
      },
      {
        evidence: [
          "PR #164 merged as f6ceb0c4; main quality and both production deployments passed, authenticated production displays the CSV/PDF Export control, and nine focused tests parse the PDF and verify exact CSV fields, authorization, formula safety, pagination, routes, and bounded failures",
        ],
        state: "complete",
        title: "Verify accurate CSV and PDF exports",
      },
      {
        evidence: [
          "PR #165 merged as 2387591e; main quality, the production migration, and both deployments passed, while focused sharing and RLS proof covers explicit Viewer, Manager, No access, role isolation, and failures; one authenticated production grant/revoke journey and a forward database rollback remain",
        ],
        state: "in_progress",
        title:
          "Verify explicit revocable board sharing, role isolation, failure states, and production rollback",
      },
    ]),
  },
  {
    id: "wave-6-resources-guides",
    sequence: 6,
    status: "active",
    title: "Qualified resources and varied guides",
    criteria: defineCriteria(6, [
      {
        evidence: [
          "The 2026-08-13 read-only count refresh separates local and production snapshots: the expanded local curated artifact has 5,046 candidates and 741 complete, verified, publishable records; production has 2,184 staged records and exact parity at 853 verified, administrator-approved, publishable, promoted, and anonymous public rows",
        ],
        state: "complete",
        title:
          "Report exact candidate, complete, verified, publishable, promoted, and public counts",
      },
      {
        evidence: [
          "PRs #167-#171 repaired the selected housing, food, and immigrant/refugee cohorts, with #171 hosted quality and both deployments passing: housing two-source coverage increased from 92/106 to 99/106, food contact or intake coverage from 644/752 to 748/752, and immigrant/refugee two-source identity coverage from 68/84 to 79/84; evidence failures remain explicitly held and nothing was approved or published",
        ],
        state: "complete",
        title:
          "Fix resource listings missing provider proof, eligibility, a clear summary, access steps, contact details, or a second source",
      },
      {
        evidence: [
          "PRs #174-#175 refreshed existing staging and stored bounded verification without publishing unverified records; on 2026-08-13 the product owner approved only Bremen Township, Brookfield Library, and Calumet Township after all three matched the current 33-row official source, and the guarded production canary promoted exactly those three with zero duplicate matches; anonymous public parity increased only from 853 to 856, exact detail routes passed, three contacts and six links remained private, removed courthouse rows remained held, and PR #177 closed the obsolete bulk-detail endpoint before publication",
        ],
        state: "complete",
        title:
          "Publish toward 5,000 useful resources without raw intake, synthetic seeds, or unverified discovery records",
      },
      {
        evidence: [
          "The current production catalog has 394 Chicago resources spanning food (201), community (114), housing (69), legal (31), family (23), and health (7); a focused implementation derives six Chicago guides from current public location and category fields with a minimum of five records per guide, while merge, deployment, live counts, link checks, and production browser proof remain",
        ],
        state: "in_progress",
        title:
          "Publish current location-connected guides across multiple service categories",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Complete cohort canary, count parity, broken-link checks, production monitoring, and reversible unpublish proof",
      },
    ]),
  },
  {
    id: "wave-7-integrated-release",
    sequence: 7,
    status: "queued",
    title: "Integrated production release",
    criteria: defineCriteria(7, [
      {
        evidence: [],
        state: "not_started",
        title:
          "Pass the full quality gate, connected RLS where changed, and migration parity",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Complete security review, support runbook, ownership, and monitoring setup",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Verify hosted paid, free, member, coach, and admin journeys in light, dark, desktop, and mobile",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Rehearse rollback and complete controlled paid and free canaries with gradual rollout",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Verify production deployment, smoke checks, clean monitoring, and no unresolved P0 risk",
      },
    ]),
  },
]

const allCriteria = FINANCE_PLAN_WAVES.flatMap((wave) => wave.criteria)

export const FINANCE_PLAN_WAVE_COUNTS = {
  complete: allCriteria.filter((criterion) => criterion.state === "complete")
    .length,
  inProgress: allCriteria.filter(
    (criterion) => criterion.state === "in_progress"
  ).length,
  notStarted: allCriteria.filter(
    (criterion) => criterion.state === "not_started"
  ).length,
  total: allCriteria.length,
} as const

export const FINANCE_PLAN_COMPLETION_PERCENTAGE = Math.round(
  (FINANCE_PLAN_WAVE_COUNTS.complete / FINANCE_PLAN_WAVE_COUNTS.total) * 100
)

export const FINANCE_PLAN_WAVE_STATUS_COUNTS = {
  active: FINANCE_PLAN_WAVES.filter((wave) => wave.status === "active").length,
  codeComplete: FINANCE_PLAN_WAVES.filter(
    (wave) => wave.status === "code_complete"
  ).length,
  previewVerified: FINANCE_PLAN_WAVES.filter(
    (wave) => wave.status === "preview_verified"
  ).length,
  productionVerified: FINANCE_PLAN_WAVES.filter(
    (wave) => wave.status === "production_verified"
  ).length,
  queued: FINANCE_PLAN_WAVES.filter((wave) => wave.status === "queued").length,
  total: FINANCE_PLAN_WAVES.length,
} as const

export const FINANCE_PLAN_CURRENT_WAVE =
  FINANCE_PLAN_WAVES.find((wave) => wave.status === "active") ??
  FINANCE_PLAN_WAVES.find((wave) => wave.status !== "production_verified") ??
  FINANCE_PLAN_WAVES.at(-1)!

export const FINANCE_PLAN_NEXT_CRITERION =
  FINANCE_PLAN_CURRENT_WAVE.criteria.find(
    (criterion) => criterion.state === "in_progress"
  ) ??
  FINANCE_PLAN_CURRENT_WAVE.criteria.find(
    (criterion) => criterion.state === "not_started"
  )
