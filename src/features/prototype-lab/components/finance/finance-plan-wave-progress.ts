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
          "PR #156 provides current product-specific documents, canonical routes, and required acceptance; legal review is complete",
        ],
        state: "in_progress",
        title:
          "Provide canonical Terms and Privacy pages with required acceptance on every signup surface",
      },
      {
        evidence: [
          "PR #156 binds signup to version 2026-08-12.1 and exact SHA-256 hashes; connected migration proof and production remain pending",
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
        evidence: [],
        state: "not_started",
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
        evidence: [],
        state: "not_started",
        title:
          "Meet payload, first-useful-render, LCP, and interaction budgets in preview and production",
      },
    ]),
  },
  {
    id: "wave-4-my-map",
    sequence: 4,
    status: "queued",
    title: "Collect and My Map completion",
    criteria: defineCriteria(4, [
      {
        evidence: [],
        state: "not_started",
        title:
          "Let visitors collect and remove nonprofits and resources locally",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Persist signed-in collections across devices with safe idempotent replay",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Build My Map on the existing saved-organization foundation without separate Finder onboarding",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Keep collected records resolvable through loading, empty, stale, and error states",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Verify guest, account, and Builder journeys with RLS, production monitoring, and rollback proof",
      },
    ]),
  },
  {
    id: "wave-5-finance-reporting",
    sequence: 5,
    status: "queued",
    title: "Finance reporting completion",
    criteria: defineCriteria(5, [
      {
        evidence: [],
        state: "not_started",
        title:
          "Connect read-only external activity with explicit source and freshness labels",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Provide a simple accessible graph, text equivalent, Activity list, and History",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Reconcile visible reporting to authorized external records and correction history",
      },
      {
        evidence: [],
        state: "not_started",
        title: "Verify accurate CSV and PDF exports",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Verify explicit revocable board sharing, role isolation, failure states, and production rollback",
      },
    ]),
  },
  {
    id: "wave-6-resources-guides",
    sequence: 6,
    status: "queued",
    title: "Qualified resources and varied guides",
    criteria: defineCriteria(6, [
      {
        evidence: [],
        state: "not_started",
        title:
          "Report exact candidate, complete, verified, publishable, promoted, and public counts",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Close provider, eligibility, summary, access, contact, and comparison evidence gaps by cohort",
      },
      {
        evidence: [],
        state: "not_started",
        title:
          "Publish toward 5,000 useful resources without raw intake, synthetic seeds, or unverified discovery records",
      },
      {
        evidence: [],
        state: "not_started",
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
