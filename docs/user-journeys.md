# User Journeys — Coach House LMS

The diagram below maps the primary user flows across Public, Auth, Student, Admin, and Stripe/Webhooks. It reflects current routes, guards, and key states described in docs/AGENTS.md and implemented across the app.

```mermaid
flowchart LR
  %% === Lanes ===
  subgraph Public
    A_Landing["Landing (/) "]
    A_Pricing["Pricing (/pricing)"]
  end

  subgraph Auth
    B_Login["Login (/login)"]
    B_Signup["Sign up (/sign-up)"]
    B_Forgot["Forgot password (/forgot-password)"]
    B_Update["Update password (/update-password)"]
    B_Callback[("Callback (/callback)")]
    B_Invite[("Invite accept (/invite/:token)")]
  end

  subgraph Student
    C_Gate["Gate: Onboarding?"]
    C_Onboarding["Onboarding (/onboarding)"]
    C_Dashboard["Dashboard (/dashboard)"]
    C_NextUp["Next Up (RPC: next_unlocked_module — enrolled only)"]
    C_Classes["Classes (/classes)"]
    C_Class["Class (optional)"]
    C_Module["Module (/class/[slug]/module/[index])"]
    C_Submit["Submission stored"]
    C_NextModule["Next unlocked module"]
    C_Orgs["Organizations (/organizations)"]
    C_People["People (/people) — enrolled classes list"]
    C_Settings["Settings (/settings)"]
    C_Billing["Billing (/billing)"]
  end

  subgraph Admin
    D_Admin["Admin (/admin)"]
    D_Classes["Classes (/admin/classes)"]
    D_Class["Class detail (/admin/classes/[id])"]
    D_Module["Module editor (/admin/modules/[id])"]
    D_Users["People (/admin/users)"]
    D_User["User detail (/admin/users/[id])"]
  end

  subgraph Stripe[Stripe / Webhooks]
    E_Checkout["Stripe Checkout"]
    E_Success["Return (/pricing/success)"]
    E_Webhook[("Webhook (/api/stripe/webhook)")]
    E_Portal["Stripe Portal"]
  end

  %% Public → Auth/Stripe
  A_Landing -->|View plans| A_Pricing
  A_Pricing -->|Start checkout| E_Checkout

  %% Stripe ↔ App
  E_Checkout -->|Return URL| E_Success
  E_Checkout -. Event .-> E_Webhook
  E_Success -->|Status visible| C_Dashboard
  E_Webhook -->|Subscription sync| C_Dashboard

  %% Billing portal
  C_Billing -->|Open portal| E_Portal
  E_Portal -->|Return| C_Billing

  %% Auth → Student Gate + Invite
  B_Signup -->|Email verify / magic link| B_Callback
  B_Login --> C_Gate
  B_Callback --> C_Gate
  B_Forgot -->|Reset link| B_Update
  B_Invite -->|Unauthenticated| B_Login
  B_Invite -->|Authenticated/verified| C_Dashboard

  %% Student flows
  C_Gate -->|No| C_Onboarding
  C_Onboarding -->|Complete| C_Dashboard
  C_Gate -->|Yes| C_Dashboard
  C_Dashboard --> C_NextUp
  C_NextUp -->|Resume| C_Module
  C_Dashboard --> C_Classes
  C_Classes -->|Open| C_Class
  C_Class -->|Select module| C_Module
  C_Module -->|Submit| C_Submit
  C_Submit -->|complete_on_submit| C_NextModule
  C_NextModule -->|Open next| C_Module
  C_Submit -->|Needs revise| C_Module
  C_Module -->|Download deck| API_Deck["GET /api/modules/:id/deck (signed URL)"]:::api
  C_Dashboard --> C_Orgs
  C_Dashboard --> C_People
  C_Dashboard --> C_Settings
  C_Dashboard --> C_Billing

  %% Student → Admin (admins only)
  C_Dashboard -. Admin link (admins only) .-> D_Admin

  %% Admin flows
  D_Admin -->|Manage content| D_Classes
  D_Classes -->|Edit class| D_Class
  D_Class -->|Edit module| D_Module
  D_Admin -->|People| D_Users
  D_Users -->|View user| D_User

  %% Guards (explicit)
  C_Dashboard -. 401 → /login?redirect=… .-> B_Login
  D_Admin -. 403 (non-admin) .-> C_Dashboard
  ERR_404[(404)]:::err

  %% Styles
  classDef api fill:#eef9ff,stroke:#90cdf4,color:#1e293b
  classDef err fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
```

Notes
- Guards: All protected routes redirect unauthenticated users to `/login?redirect=…`. Admin routes redirect non‑admins back to the dashboard. 404 is shown for missing classes/modules.
- Next Up: Derived by RPC `next_unlocked_module` (enrolled classes only) and renders a deep link to the next available module.
- Module progression and assignments: Submissions persist; when `complete_on_submit` is true, submission marks the module complete and advances Next Up. “Needs revise” allows resubmission; policy on pausing progression can be decided.
- Billing: `/billing` opens Stripe Customer Portal and returns to `/billing`; webhook sync keeps subscription status accurate on the dashboard.
- Decks: Private PDF downloads are served via server endpoint that creates a short‑lived signed URL.
- People: Student People page currently lists enrolled classes; per‑class rosters can be added later with RLS.

Tip: You can paste this mermaid block into GitHub comments, issues, or Markdown viewers that support Mermaid to see the rendered diagram.
