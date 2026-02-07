# Elective Entitlement Scenarios (MVP)
Status: Implemented (v1)
Owner: Product + Eng
Updated: 2026-02-06

---

## Scope
- Formation modules remain open to all authenticated users.
  - `naming-your-nfp`
  - `nfp-registration`
  - `filing-1023`
- Elective add-ons require entitlement per module:
  - `retention-and-security`
  - `due-diligence`
  - `financial-handbook`
- Full Accelerator access unlocks all tracks and all electives.

## Checkout Modes
- `organization`:
  - Stripe subscription checkout.
  - Persists `subscriptions` row.
- `accelerator`:
  - Supports one-time (`payment`) and monthly (`subscription`) checkout.
  - Persists accelerator metadata (`variant`, `billing`, `coaching_included`) on Stripe session/subscription.
- `elective`:
  - Stripe payment checkout per module.
  - Persists `elective_purchases` row with `module_slug`.

## Entitlement Resolution
- Source of truth:
  - `accelerator_purchases` (`active`)
  - `subscriptions` (`active` or `trialing`)
  - `elective_purchases` (`active`)
- Resolver:
  - `src/lib/accelerator/entitlements.ts`
- Rules:
  - `hasAcceleratorAccess = admin OR active accelerator purchase OR active/trialing subscription`
  - `hasElectiveAccess = hasAcceleratorAccess OR at least one active elective purchase`

## Access Matrix
| User state | Formation core modules | Purchased elective modules | Unpurchased elective modules | Non-formation tracks |
| --- | --- | --- | --- | --- |
| No purchases | Open | Locked | Locked | Locked |
| Elective-only purchase(s) | Open | Open | Locked | Locked |
| Accelerator purchase (base/coaching) | Open | Open | Open | Open |
| Active/trialing subscription only | Open | Open | Open | Open |
| Admin | Open | Open | Open | Open |

## UX Outcomes
- Right rail track selector:
  - Uses unified `track-picker` + `classTrack`.
  - Formation is first.
  - Electives is separate.
- Electives upsell:
  - Pricing has dedicated elective cards and checkout buttons.
  - Right rail shows “Unlock”/“Buy more” messaging when appropriate.
- Route guards:
  - `/class/{slug}/module/{index}` enforces accelerator or elective entitlement server-side.

## Stripe Metadata (payment mode)
- Accelerator checkout:
  - `kind=accelerator`
  - `accelerator_variant`
  - `accelerator_billing`
  - `coaching_included`
- Elective checkout:
  - `kind=elective`
  - `elective_module_slug`

## Persistence Paths
- Success page:
  - `src/app/(public)/pricing/success/page.tsx`
- Webhook:
  - `src/app/api/stripe/webhook/route.ts`
- Idempotency:
  - Existing webhook-event idempotency remains in place.
  - Elective upsert uses `onConflict: "user_id,module_slug"`.

## QA Routes
- `/pricing`
- `/pricing?plan=electives`
- `/accelerator`
- `/accelerator/class/electives/module/4` (Formation: Naming your NFP)
- `/class/electives/module/5` (Formation: NFP Registration)
- `/class/electives/module/6` (Formation: Filing 1023)
- `/class/electives/module/1` (Elective: Financial Handbook)
- `/class/electives/module/2` (Elective: Due Diligence)
- `/class/electives/module/3` (Elective: Retention and Security)
- `/class/strategic-foundations/module/1` (Accelerator-gated baseline)
