# User Journeys — Proposal (vNext)

This proposal extends the current journeys with missing steps and clearer guard/error states. It adds billing portal loops, invite acceptance, assignment revise/resubmit behavior, and deck download via signed URLs.

```mermaid
flowchart LR
  %% === Lanes ===
  subgraph Public
    PUB_Landing["Landing (/) "]
    PUB_Pricing["Pricing (/pricing)"]
  end

  subgraph Auth
    AUTH_Login["Login (/login)"]
    AUTH_Signup["Sign up (/sign-up)"]
    AUTH_Forgot["Forgot password (/forgot-password)"]
    AUTH_Update["Update password (/update-password)"]
    AUTH_Callback[("Callback (/callback)")]
    AUTH_Invite[("Invite accept (/invite/:token)")]
  end

  subgraph Student
    ST_Gate["Gate: Onboarding?"]
    ST_Onboarding["Onboarding (/onboarding)"]
    ST_Dashboard["Dashboard (/dashboard)"]
    ST_NextUp["Next Up (RPC: next_unlocked_module — enrolled only)"]
    ST_Classes["Classes (/classes)"]
    ST_Class["Class (optional)"]
    ST_Module["Module (/class/[slug]/module/[index])"]
    ST_Submit["Submission stored"]
    ST_NextModule["Next unlocked module"]
    ST_Orgs["Organizations (/organizations)"]
    ST_People["People (/people) — enrolled classes list"]
    ST_Settings["Settings (/settings)"]
    ST_Billing["Billing (/billing)"]
  end

  subgraph Admin
    AD_Root["Admin (/admin)"]
    AD_Classes["Classes (/admin/classes)"]
    AD_Class["Class detail (/admin/classes/[id])"]
    AD_Module["Module editor (/admin/modules/[id])"]
    AD_Users["People (/admin/users)"]
    AD_User["User detail (/admin/users/[id])"]
  end

  subgraph Stripe[Stripe / Webhooks]
    STR_Checkout["Stripe Checkout"]
    STR_Success["Return (/pricing/success)"]
    STR_Webhook[("Webhook (/api/stripe/webhook)")]
    STR_Portal["Stripe Portal"]
  end

  %% === Public → Pricing/Checkout ===
  PUB_Landing -->|View plans| PUB_Pricing
  PUB_Pricing -->|Start checkout| STR_Checkout

  %% === Stripe flows ===
  STR_Checkout -->|Return URL| STR_Success
  STR_Checkout -. Event .-> STR_Webhook
  STR_Success -->|Status visible| ST_Dashboard
  STR_Webhook -->|Subscription sync| ST_Dashboard

  %% Billing portal management
  ST_Billing -->|Open portal| STR_Portal
  STR_Portal -->|Return| ST_Billing

  %% === Auth and Invite acceptance ===
  AUTH_Signup -->|Email verify / magic link| AUTH_Callback
  AUTH_Forgot -->|Reset link| AUTH_Update
  AUTH_Login --> ST_Gate
  AUTH_Callback --> ST_Gate
  AUTH_Invite -->|Unauthenticated| AUTH_Login
  AUTH_Invite -->|Authenticated/verified| ST_Dashboard

  %% === Student guard + onboarding ===
  ST_Gate -->|No| ST_Onboarding
  ST_Onboarding -->|Complete| ST_Dashboard
  ST_Gate -->|Yes| ST_Dashboard

  %% === Student dashboard journeys ===
  ST_Dashboard --> ST_NextUp
  ST_NextUp -->|Resume| ST_Module
  ST_Dashboard --> ST_Classes
  ST_Classes -->|Open| ST_Class
  ST_Class -->|Select module| ST_Module

  %% Assignments + revise/resubmit behavior
  ST_Module -->|Submit| ST_Submit
  ST_Submit -->|complete_on_submit| ST_NextModule
  ST_NextModule -->|Open next| ST_Module
  ST_Submit -->|Needs revise| ST_Module

  %% Deck download via signed URL
  ST_Module -->|Download deck| API_Deck["GET /api/modules/:id/deck (signed URL)"]:::api

  %% Other destinations
  ST_Dashboard --> ST_Orgs
  ST_Dashboard --> ST_People
  ST_Dashboard --> ST_Settings
  ST_Dashboard --> ST_Billing

  %% Student → Admin (admins only)
  ST_Dashboard -. Admin link (admins only) .-> AD_Root

  %% === Admin authoring ===
  AD_Root -->|Manage content| AD_Classes
  AD_Classes -->|Edit class| AD_Class
  AD_Class -->|Edit module| AD_Module
  AD_Root -->|People| AD_Users
  AD_Users -->|View user| AD_User

  %% === Guards / Errors (explicit) ===
  ST_Dashboard -. 401 → /login?redirect=… .-> AUTH_Login
  AD_Root -. 403 (non-admin) .-> ST_Dashboard
  MISSING[(404)]:::err

  %% Classes: style helpers
  classDef api fill:#eef9ff,stroke:#90cdf4,color:#1e293b
  classDef err fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
```

Scope clarifications
- Next Up: Computed by `next_unlocked_module` (restricted to enrolled classes) to avoid surfacing content from non‑enrolled classes.
- Invite acceptance: Proposed `/invite/:token` that either prompts auth or directly enrolls and redirects to the dashboard.
- Revise/resubmit: Learners can resubmit even if `complete_on_submit` marked the module complete; this flags the module for review. Consider whether a “revise” state should pause downstream unlocking.
- Billing portal: Include a portal loop so learners can manage payment method/invoices and return to `/billing`.
- Deck downloads: Diagram shows server‑mediated signed URL endpoint for private PDFs.
- Guards/errors: Explicit 401/403/404 encourages well‑defined UX for unauthenticated, unauthorized, and not‑found states.

Open questions
- Should “Needs revise” roll back `module_progress` from completed, or overlay a badge without blocking progression?
- Invite acceptance UX: do we offer lightweight signup within `/invite/:token`, or always require login first?
- People page: when RLS permits, should learners see per‑class rosters and mentor roles?
- Admin audit: do we persist an audit table (not just logs) for enroll/unenroll/invite with RLS for admins?

Next steps
- Decide on the “revise rolls back completion” policy and update module state logic accordingly.
- Add `/invite/:token` route and server action to validate tokens and enroll users.
- Extend People page once roster reads are permitted by RLS.
