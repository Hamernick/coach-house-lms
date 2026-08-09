# User audience overview

Snapshot date: August 3, 2026

## Partner-ready summary

Coach House has 180 external, non-synthetic accounts. That is a promising audience base, but it is not the same as 180 active customers: 77 have at least one recorded authenticated session, 27 used tracked product features in the last 30 days, and 21 regular users currently have a paid Stripe subscription whose latest invoice collected money.

The strongest audience is nonprofit builders and organization leaders. About two-thirds selected the Build path, 53 created an organization, and all 21 current paying regular users selected Build. Eighteen of those payers own an organization.

Most growth came from a sustained May signup wave: 110 accounts, or 61% of the external account base, joined that month. Only 25 of that cohort have a recorded authenticated session and 15 produced any tracked product activity. That one cohort explains much of the gap between registered accounts and active users.

The audience appears to mix established organization leaders with grassroots founders. Forty-six percent use an organization or custom email domain, 37% use Gmail, and 18% use another consumer provider. Among the 53 organizations, 21 report IRS approval, 13 are pre-501(c)(3) or in progress, and 19 did not provide a formation stage.

We cannot reliably say which campaign, partner, or referral produced the May wave. Historical signup records captured intent but not first-touch source, UTM values, referring page, or partner code. Current web analytics also show only small named referrers, so most acquisition remains direct or unattributed.

## What the 180 accounts represent

| Measure | Count | Meaning |
| --- | ---: | --- |
| External, non-synthetic accounts | 180 | Excludes 11 synthetic/demo accounts and 3 internal staff accounts from 194 Auth records. This is an account count, not a deduplicated count of humans. |
| Regular accounts | 158 | External accounts without tester access. |
| Tester accounts | 22 | Real, non-staff accounts with tester access; not fake seed accounts. |
| Authenticated at least once | 77 | At least one successful authenticated session is recorded. This may include a session created during signup or email confirmation. |
| Tracked active, last 30 days | 27 | Used a feature that emitted product telemetry; 23 regular users and 4 testers. |
| Current paying regular users | 21 | Active Stripe subscription and latest invoice collected money; excludes testers and $0 invoices. |
| Organization owners | 53 | Created or own an organization in Coach House. |

## Audience profile

### Selected product intent

| Path | Accounts | Authenticated at least once | Active in 30 days | Organization owners | Current payers |
| --- | ---: | ---: | ---: | ---: | ---: |
| Build | 118 | 66 | 27 | 50 | 21 |
| Find | 56 | 5 | 0 | 1 | 0 |
| Other or unknown | 6 | 6 | 0 | 2 | 0 |

The Build path is the clearest product-market signal. Find attracted registrations but has not converted into sustained authenticated use in the last 30 days. These are self-selected onboarding intentions, not verified job titles.

### Email affiliation

| Email type | Accounts | Share |
| --- | ---: | ---: |
| Organization or custom domain | 82 | 46% |
| Gmail | 66 | 37% |
| Other consumer email | 32 | 18% |

The 82 custom-domain accounts span 73 domains, so this is a broad collection of mostly separate organizations rather than a few large teams.

### Organization maturity and location

| Formation stage | Organizations | Share of 53 |
| --- | ---: | ---: |
| IRS approved | 21 | 40% |
| Pre-501(c)(3) | 7 | 13% |
| In progress | 6 | 11% |
| Unknown | 19 | 36% |

Only 17 organizations supplied a usable state; all 17 are in Illinois. Because location is missing for 36 organizations and most individual profiles, Illinois is a strong signal among known records, not proof that the whole audience is Illinois-based.

## Signup pattern

| Month | Regular | Testers | Total |
| --- | ---: | ---: | ---: |
| January 2026 | 3 | 0 | 3 |
| February | 1 | 15 | 16 |
| March | 11 | 4 | 15 |
| April | 19 | 1 | 20 |
| May | 110 | 0 | 110 |
| June | 6 | 2 | 8 |
| July | 7 | 0 | 7 |
| August through August 3 | 1 | 0 | 1 |

The May accounts arrived across the month rather than at one import timestamp. That is consistent with a sustained campaign, launch, or community push, but the system did not store enough attribution data to identify which one.

## Current traffic context

Vercel Web Analytics recorded 184 anonymous visitors and 990 page views from July 4 through August 3, with a 43% bounce rate. The most visited pages were the homepage (129 visitors), Workspace (89), Find (63), and the Accelerator (21). Traffic was 97% United States and 86% desktop.

These visitor counts are anonymous browser traffic and cannot be matched one-to-one with the 180 accounts. Named referrers were small: Stripe Checkout 5, coachhousesolutions.org 4, Google 4, Bing 3, and Gmail 3.

## Recommendations

1. Position Build-focused founders and organization owners as the primary customer profile. They account for all current regular-user revenue.
2. Run a focused reactivation effort for the May cohort, especially the 85 accounts with no authenticated session recorded.
3. Rework the Find signup and onboarding path before spending to grow it; 56 accounts selected Find, but only 5 have a recorded authenticated session and none were active in the last 30 days.
4. Capture first-touch source, UTM campaign fields, initial referrer, landing page, and partner/referral code at signup before the next promotion.
5. Report registrations, sign-ins, active product users, and paying users separately so the 180-account audience is not presented as 180 customers.

## Definitions and limits

- Account counts may include duplicate people using different email addresses; no identity-deduplication claim is made.
- `last_sign_in_at` means Supabase recorded at least one successful authenticated session, possibly during signup or email confirmation. It does not prove a later manual login or current activity.
- Product activity uses tracked `user_journey_events`; untracked behavior is not counted.
- Payment status uses Stripe as the authority. Local subscription rows are not reliable enough for the headline payer count.
- Marketing and newsletter flags were excluded because historical schema defaults make them unsuitable evidence of voluntary interest.
- Acquisition-channel conclusions are limited because historical first-touch attribution was not stored.

## Sources

- Production Supabase Auth and application data: `auth.users`, `auth.identities`, `public.profiles`, `public.organizations`, `public.organization_memberships`, `public.platform_staff_members`, and `public.user_journey_events`.
- Live Stripe customers, subscriptions, and latest invoices.
- Vercel Web Analytics, custom 30-day window ending August 3, 2026.
- Sanitized aggregate snapshot: `analysis-snapshot.json` in this folder. No personal identifiers are stored in this brief.
