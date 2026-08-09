# Admin Organization Billing Feature

## Ownership

- Live Stripe subscription and payment queries: `server/**`
- Developer-only plan and refund mutations: `server/actions.ts`
- Organization-detail billing UI: `components/**`
- Pure plan and display helpers: `lib/**`

## Rules

- Every loader and mutation requires broad platform-admin access server-side.
- Coaches and customer organization roles never receive these controls.
- Plan changes replace the existing subscription item and disable proration.
- Refunds target the latest paid invoice for the exact organization subscription.
- Billing UI is advisory; Stripe remains the financial source of truth.
- Keep acceptance coverage in `tests/acceptance/admin-organization-billing.test.ts`.
