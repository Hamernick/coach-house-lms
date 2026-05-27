import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { listUpcomingCoachingBookings, resolveCoachingCreditSummary } from "@/features/coaching-booking/server/data"

const ROOT = process.cwd()

type PurchaseRow = { coaching_included: boolean | null }
type SubscriptionRow = { status: string; metadata: Record<string, unknown> | null }
type LedgerRow = { quantity: number; source: string; expires_at: string | null }
type BookingRow = {
  id: string
  org_id: string
  coach_id: string
  status: string
  price_tier: string
  starts_at: string
  ends_at: string
  timezone: string
  google_meet_url: string | null
  google_event_html_link: string | null
}

function createCreditSummarySupabaseStub({
  purchases = [],
  subscriptions = [],
  ledger = [],
}: {
  purchases?: PurchaseRow[]
  subscriptions?: SubscriptionRow[]
  ledger?: LedgerRow[]
}) {
  return {
    from(table: string) {
      if (table === "accelerator_purchases") {
        return {
          select: () => ({
            in: () => ({
              eq: () => ({
                returns: async () => ({ data: purchases, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === "subscriptions") {
        return {
          select: () => ({
            in: () => ({
              in: () => ({
                returns: async () => ({ data: subscriptions, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === "coaching_credit_ledger") {
        return {
          select: () => ({
            eq: () => ({
              returns: async () => ({ data: ledger, error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  } as never
}

function consumedCredits(count: number): LedgerRow[] {
  return Array.from({ length: count }, () => ({
    quantity: -1,
    source: "booking",
    expires_at: null,
  }))
}

function createUpcomingBookingsSupabaseStub(rows: BookingRow[]) {
  const calls: {
    statusEq?: string
    statusIn?: string[]
  } = {}

  return {
    calls,
    supabase: {
      from(table: string) {
        if (table !== "coaching_bookings") {
          throw new Error(`Unexpected table: ${table}`)
        }

        const filters: {
          orgId?: string
          status?: string
          statusIn?: string[]
          endsAfter?: string
        } = {}

        const query = {
          select: () => query,
          eq: (column: string, value: string) => {
            if (column === "org_id") filters.orgId = value
            if (column === "status") {
              filters.status = value
              calls.statusEq = value
            }
            return query
          },
          in: (column: string, values: string[]) => {
            if (column === "status") {
              filters.statusIn = values
              calls.statusIn = values
            }
            return query
          },
          gte: (column: string, value: string) => {
            if (column === "ends_at") filters.endsAfter = value
            return query
          },
          order: () => query,
          limit: () => ({
            returns: async () => ({
              data: rows
                .filter((row) => (filters.orgId ? row.org_id === filters.orgId : true))
                .filter((row) => (filters.status ? row.status === filters.status : true))
                .filter((row) => (filters.statusIn ? filters.statusIn.includes(row.status) : true))
                .filter((row) => (filters.endsAfter ? row.ends_at >= filters.endsAfter : true)),
              error: null,
            }),
          }),
        }

        return query
      },
    } as never,
  }
}

function readSource(relativePath: string) {
  return readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("coaching booking feature", () => {
  it("adds coaching as a dashboard route backed by a feature slice", () => {
    const route = readSource("src/app/(dashboard)/coaching/page.tsx")
    const featureIndex = readSource("src/features/coaching-booking/index.ts")
    const page = readSource("src/features/coaching-booking/components/coaching-booking-page.tsx")
    const flow = readSource("src/features/coaching-booking/components/coaching-booking-flow.tsx")
    const calendar = readSource("src/components/ui/calendar.tsx")
    const appShell = readSource("src/components/app-shell/app-shell-inner.tsx")
    const scrollFade = readSource("src/components/scroll-fade-effect.tsx")
    const globals = readSource("src/app/globals.css")

    expect(route).toContain('import { CoachingBookingPage } from "@/features/coaching-booking"')
    expect(featureIndex).toContain('export { CoachingBookingPage } from "./components"')
    expect(page).toContain("loadCoachingBookingPageData")
    expect(page).toContain("cancelPendingCoachingCheckoutReturn")
    expect(page).toContain("confirmPaidCoachingCheckoutReturn")
    expect(page).toContain('checkout === "cancelled"')
    expect(page).toContain("if (!result.confirmed)")
    expect(page).toContain('checkout === "success"')
    expect(page).toContain('redirect("/login?redirect=/coaching")')
    expect(page).toContain("redirect(COACHING_PATH)")
    expect(flow).toContain("Let's talk business")
    expect(flow).toContain("Meet with coaches for focused support")
    expect(flow).toContain("SessionDetailsPanel")
    expect(flow).toContain("max-w-[52.25rem]")
    expect(flow).toContain("lg:grid-cols-[20rem_minmax(0,1fr)]")
    expect(flow).toContain("Use coaching credit")
    expect(flow).toContain("Continue to checkout")
    expect(flow).toContain("checkoutUnavailable")
    expect(flow).toContain("Coaching checkout is not configured yet.")
    expect(flow).toContain("TimeFormatToggle")
    expect(flow).toContain('aria-label="Time format"')
    expect(flow).toContain("min-h-full px-0 py-0 sm:px-4 sm:py-6 lg:px-6")
    expect(flow).toContain(
      "max-w-[52.25rem] flex-col gap-5 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:gap-6 sm:pb-0",
    )
    expect(flow).toContain("overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm")
    expect(flow).toContain("lg:grid-cols-[260px_12.75rem]")
    expect(flow).toContain("lg:justify-start")
    expect(flow).toContain("flex w-full flex-col gap-7 sm:mx-auto sm:w-[316px] sm:max-w-full")
    expect(flow).toContain("lg:pr-3")
    expect(flow).toContain("lg:w-[30rem]")
    expect(flow).toContain("grid w-full justify-items-stretch gap-x-4 gap-y-7")
    expect(flow).toContain("lg:mx-0")
    expect(flow).toContain("w-full min-w-0 sm:w-[316px] sm:max-w-full lg:w-[260px]")
    expect(flow).toContain(
      "w-full p-0 [--cell-size:calc((100%_-_2.25rem)/7)] sm:w-[316px] sm:max-w-full sm:[--cell-size:--spacing(10)] lg:w-[260px] lg:[--cell-size:--spacing(8)]",
    )
    expect(flow).not.toContain("w-fit max-w-full p-0 [--cell-size:--spacing(10)]")
    expect(flow).toContain("flex w-full min-w-0 flex-col gap-4 sm:w-[316px] sm:max-w-full lg:w-[12.75rem] lg:gap-3")
    expect(flow).toContain("flex min-w-0 flex-col px-4 py-5 sm:p-6 lg:pr-3")
    expect(flow).toContain('aria-live="polite"')
    expect(flow).toContain("inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted")
    expect(flow).toContain("Choose a time")
    expect(flow).toContain("Pick an open session above to review the session details.")
    expect(flow).toContain("grid h-11 min-h-11 w-full")
    expect(flow).toContain("sm:h-8 sm:min-h-8")
    expect(flow).toContain("setCalendarMonth((currentMonth)")
    expect(flow).toContain("currentMonth.getTime() === nextMonth.getTime() ? currentMonth : nextMonth")
    expect(flow).toContain("flex items-center justify-between gap-3 sm:gap-2")
    expect(flow).toContain("whitespace-nowrap text-xl font-semibold text-foreground")
    expect(flow).toContain("h-9 min-h-9 min-w-12 rounded-md")
    expect(flow).toContain("sm:h-7 sm:min-h-7 sm:min-w-11 sm:px-2.5 sm:text-xs")
    expect(flow).toContain("inline-flex w-fit shrink-0 rounded-lg bg-muted p-0.5 sm:rounded-md")
    expect(flow).toContain("inline-flex h-9 items-center")
    expect(flow).toContain("sm:h-7")
    expect(flow).toContain("bg-emerald-500")
    expect(flow).toContain("border-emerald-500 bg-emerald-500/10")
    expect(flow).toContain('max-h-[22rem]')
    expect(flow).toContain("availableCalendarDates")
    expect(flow).toContain("unavailableCalendarDates")
    expect(flow).toContain("available: availableCalendarDates")
    expect(flow).toContain("unavailable: unavailableCalendarDates")
    expect(flow).toContain("listCoachingAvailabilityAction")
    expect(flow).toContain("reserveCoachingBookingAction")
    expect(flow).toContain("groupSlotsByDate")
    expect(flow).not.toContain("Availability for")
    expect(flow).not.toContain("Joint availability")
    expect(flow).toContain("No open sessions on this date.")
    expect(flow).toContain("Calendar availability is unavailable in this local session.")
    expect(flow).toContain('className="object-cover"')
    expect(flow).not.toContain("Badge")
    expect(flow).not.toContain("Choose a coach")
    expect(flow).not.toContain("Coach calendars need connection")
    expect(flow).not.toContain("tracking-[0.22em]")
    expect(flow).not.toContain("Loading available times")
    expect(flow).not.toContain("rounded-xl border border-border/70 px-3 py-3 text-sm text-muted-foreground")
    expect(calendar).toContain("bg-transparent group/calendar")
    expect(calendar).toContain("w-full bg-transparent group/calendar")
    expect(calendar).not.toContain("bg-background group/calendar")
    expect(calendar).not.toContain("w-[16.25rem] max-w-full")
    expect(calendar).not.toContain("root: cn(\"w-fit\"")
    expect(calendar).toContain("root: cn(\"w-full\"")
    expect(calendar).toContain("absolute top-0 right-0 flex items-center justify-end gap-1")
    expect(calendar).toContain("items-center justify-start pr-[calc(var(--cell-size)*2+0.25rem)]")
    expect(calendar).toContain("table: \"w-full border-collapse\"")
    expect(calendar).toContain("flex w-full gap-1.5")
    expect(calendar).toContain("size-(--cell-size) items-center justify-center")
    expect(calendar).toContain("relative size-(--cell-size) p-0")
    expect(calendar).toContain("size-full min-w-0")
    expect(calendar).not.toContain("size-auto w-full min-w-(--cell-size)")
    expect(calendar).not.toContain("[&:first-child[data-selected=true]_button]:rounded-l-md")
    expect(calendar).toContain("data-[selected=true]:bg-transparent")
    expect(calendar).toContain("data-available={available}")
    expect(calendar).toContain("data-unavailable={unavailable}")
    expect(calendar).toContain("data-[available=true]:bg-muted")
    expect(calendar).toContain("data-[selected-single=true]:bg-foreground")
    expect(appShell).toContain('const isCoachingRoute = pathname === "/coaching"')
    expect(appShell).toContain("const useMobileSingleGutterContent = isMobile && isCoachingRoute")
    expect(appShell).toContain("const useFlushContentBody = useFullBleedContent || useMobileSingleGutterContent")
    expect(appShell).toContain('import { ScrollFadeEffect } from "@/components/scroll-fade-effect"')
    expect(appShell).toContain("<ScrollFadeEffect")
    expect(appShell).toContain("enabled={useMobileSingleGutterContent}")
    expect(appShell).toContain('[--mask-height:2rem] [--scroll-buffer:1.5rem]')
    expect(appShell).toContain('useMobileSingleGutterContent')
    expect(appShell).toContain('? "px-[var(--shell-content-pad)]"')
    expect(appShell).toContain('useFullBleedContent ? "overflow-hidden" : "overflow-y-auto"')
    expect(scrollFade).toContain("enabled?: boolean")
    expect(scrollFade).toContain("data-[orientation=vertical]:scroll-fade-effect-y")
    expect(scrollFade).not.toContain("data-vertical")
    expect(globals).toContain("@utility scroll-fade-effect-y")
    expect(globals).toContain("animation-timeline: scroll(self), scroll(self)")
  })

  it("routes existing coaching entrypoints to /coaching instead of opening the legacy schedule link", () => {
    const card = readSource("src/components/coaching/coach-scheduling-card.tsx")
    const sidebarItem = readSource("src/components/coaching/coach-scheduling-sidebar-item.tsx")
    const navUser = readSource("src/components/nav-user/nav-user-menu-content.tsx")
    const hook = readSource("src/hooks/use-coaching-booking.ts")

    expect(card).toContain('<Link href="/coaching">Book a session</Link>')
    expect(sidebarItem).toContain('<Link href="/coaching">')
    expect(navUser).toContain('<Link href="/coaching" onClick={onCloseMenu}>')
    expect(hook).toContain('router.push("/coaching")')
    expect(hook).not.toContain("/api/meetings/schedule")
  })

  it("adds DB-backed bookings, credits, RLS, and Stripe webhook handoff", () => {
    const migration = readSource("supabase/migrations/20260517193000_add_coaching_booking.sql")
    const webhook = readSource("src/app/api/stripe/webhook/_lib/process-event.ts")
    const stripeProcessor = readSource("src/features/coaching-booking/server/stripe.ts")
    const finalizer = readSource("src/features/coaching-booking/server/booking-finalizer.ts")
    const actions = readSource("src/features/coaching-booking/server/actions.ts")
    const data = readSource("src/features/coaching-booking/server/data.ts")
    const stripeRuntime = readSource("src/lib/billing/stripe-runtime.ts")
    const checkoutReturn = readSource("src/features/coaching-booking/server/checkout-return.ts")
    const icsRoute = readSource("src/app/api/coaching/bookings/[id]/calendar.ics/route.ts")

    expect(migration).toContain("create table if not exists coaching_coaches")
    expect(migration).toContain("create table if not exists coaching_bookings")
    expect(migration).toContain("create table if not exists coaching_credit_ledger")
    expect(migration).toContain("alter table coaching_bookings enable row level security")
    expect(migration).toContain("coaching_credit_ledger_select")
    expect(webhook).toContain("processCoachingCheckoutSession(session)")
    expect(stripeProcessor).toContain('session.metadata?.kind !== "coaching_booking"')
    expect(actions).toContain('kind: "coaching_booking"')
    expect(actions).toContain("booking_id: bookingId")
    expect(actions).toContain("price_tier: priceTier")
    expect(actions).toContain("resolveStripeRuntimeConfigForCoaching")
    expect(actions).toContain('requestHeaders.get("origin")')
    expect(actions).toContain("Unable to create the coach calendar event.")
    expect(actions).toContain("COACHING_JOINT_COACH_IDS.map")
    expect(actions).toContain("COACHING_JOINT_PRIMARY_COACH_ID")
    expect(data).toContain("isStripeCoachingCheckoutConfigured")
    expect(data).toContain("paymentConfigured")
    expect(stripeRuntime).toContain("STRIPE_TEST_COACHING_FULL_PRICE_ID")
    expect(stripeRuntime).toContain("STRIPE_TEST_COACHING_DISCOUNTED_PRICE_ID")
    expect(stripeRuntime).toContain("resolveStripeRuntimeConfigForCoaching")
    expect(stripeRuntime).toContain('process.env.NODE_ENV !== "production"')
    expect(stripeRuntime).toContain("coachingFullPriceId: normalizeString(env.STRIPE_TEST_COACHING_FULL_PRICE_ID)")
    expect(stripeRuntime).not.toContain(
      "normalizeString(env.STRIPE_TEST_COACHING_FULL_PRICE_ID) ??",
    )
    expect(checkoutReturn).toContain("checkout.sessions.retrieve")
    expect(checkoutReturn).toContain('session.payment_status === "paid"')
    expect(checkoutReturn).toContain("confirmCoachingBooking")
    expect(finalizer).toContain("createGoogleCoachingEvent")
    expect(finalizer).toContain("internalAttendeeEmails")
    expect(finalizer).toContain("Coach House session with ${COACHING_JOINT_COACH_LABEL}")
    expect(finalizer).toContain("source: \"booking\"")
    expect(icsRoute).toContain("COACHING_JOINT_COACH_LABEL")
    expect(icsRoute).toContain("LOCATION:${escapeIcsText(booking.google_meet_url)}")
  })

  it("keeps Google Calendar writes behind a server adapter", () => {
    const google = readSource("src/features/coaching-booking/server/google-calendar.ts")
    const actions = readSource("src/features/coaching-booking/server/actions.ts")

    expect(google).toContain("GOOGLE_COACHING_BROKER_URL")
    expect(google).toContain("x-coach-house-signature")
    expect(google).toContain("x-vercel-oidc-token")
    expect(google).toContain("https://sts.googleapis.com/v1/token")
    expect(google).toContain("generateIdToken")
    expect(google).toContain("https://oauth2.googleapis.com/token")
    expect(google).toContain("/freeBusy")
    expect(google).toContain("conferenceDataVersion=1")
    expect(google).toContain("GOOGLE_COACHING_PAULA_IMPERSONATED_USER")
    expect(google).toContain('type: "hangoutsMeet"')
    expect(google).toContain("waitForMeetUrl")
    expect(google).toContain("requestId: randomUUID()")
    expect(google).toContain("Attendee: ${attendeeEmail}")
    expect(google).toContain("internalAttendeeEmails")
    expect(google).toContain("buildGoogleEventAttendees(internalAttendees)")
    expect(google).toContain("getGoogleCoachingParticipantEmail")
    expect(google).toContain("isLocalBrokerUrl")
    expect(google).toContain("Local Google Calendar broker proxy is not running.")
    expect(google).toContain("!isLocalBrokerUrl(brokerUrl)")
    expect(actions).toContain("isGoogleCoachingConfigured")
    expect(actions).toContain("Coach calendar is not connected yet.")
  })

  it("adds a keyless Cloud Run broker for Google Calendar service-account access", () => {
    const broker = readSource("src/cloud-run/coaching-calendar-broker/server.mjs")
    const brokerPackage = readSource("src/cloud-run/coaching-calendar-broker/package.json")
    const featureReadme = readSource("src/features/coaching-booking/README.md")

    expect(brokerPackage).toContain('"start": "node server.mjs"')
    expect(broker).toContain("metadata.google.internal")
    expect(broker).toContain("iamcredentials.googleapis.com")
    expect(broker).toContain("generateAccessToken")
    expect(broker).toContain("signJwt")
    expect(broker).toContain("GOOGLE_COACHING_PAULA_IMPERSONATED_USER")
    expect(broker).toContain('type: "hangoutsMeet"')
    expect(broker).toContain("waitForMeetUrl")
    expect(broker).toContain("https://www.googleapis.com/auth/calendar")
    expect(broker).toContain("timingSafeEqual")
    expect(broker).toContain("COACHING_CALENDAR_BROKER_SECRET")
    expect(broker).toContain("Google Calendar freeBusy failed")
    expect(broker).toContain("detail.slice(0, 500)")
    expect(broker).toContain("Attendee: ${payload.attendeeEmail}")
    expect(broker).toContain("internalAttendeeEmails")
    expect(broker).toContain("buildGoogleEventAttendees(internalAttendees)")
    expect(featureReadme).toContain("keyless Cloud Run broker")
    expect(featureReadme).toContain("Vercel OIDC")
  })

  it("limits discounted paid booking to Operations Support after included credits are gone", async () => {
    const included = await resolveCoachingCreditSummary({
      supabase: createCreditSummarySupabaseStub({
        purchases: [{ coaching_included: true }],
        ledger: consumedCredits(3),
      }),
      userId: "user-1",
      orgId: "org-1",
    })
    const nonOperationsAfterCredits = await resolveCoachingCreditSummary({
      supabase: createCreditSummarySupabaseStub({
        purchases: [{ coaching_included: true }],
        ledger: consumedCredits(4),
      }),
      userId: "user-1",
      orgId: "org-1",
    })
    const operationsSupport = await resolveCoachingCreditSummary({
      supabase: createCreditSummarySupabaseStub({
        subscriptions: [
          {
            status: "active",
            metadata: {
              planName: "Operations Support",
              plan_tier: "operations_support",
            },
          },
        ],
      }),
      userId: "user-1",
      orgId: "org-1",
    })

    expect(included).toMatchObject({
      available: 1,
      priceTier: "included",
      hasDiscountAccess: false,
    })
    expect(nonOperationsAfterCredits).toMatchObject({
      available: 0,
      priceTier: "full",
      hasDiscountAccess: false,
    })
    expect(operationsSupport).toMatchObject({
      available: 0,
      priceTier: "discounted",
      hasDiscountAccess: true,
    })
  })

  it("shows only paid-confirmed bookings in the upcoming list", async () => {
    const pendingStartsAt = "2099-01-01T15:00:00.000Z"
    const confirmedStartsAt = "2099-01-02T15:00:00.000Z"
    const { calls, supabase } = createUpcomingBookingsSupabaseStub([
      {
        id: "pending-booking",
        org_id: "org-1",
        coach_id: "joel",
        status: "pending_payment",
        price_tier: "full",
        starts_at: pendingStartsAt,
        ends_at: "2099-01-01T16:00:00.000Z",
        timezone: "America/New_York",
        google_meet_url: null,
        google_event_html_link: null,
      },
      {
        id: "confirmed-booking",
        org_id: "org-1",
        coach_id: "paula",
        status: "confirmed",
        price_tier: "full",
        starts_at: confirmedStartsAt,
        ends_at: "2099-01-02T16:00:00.000Z",
        timezone: "America/New_York",
        google_meet_url: "https://meet.google.com/test",
        google_event_html_link: "https://calendar.google.com/test",
      },
    ])

    const bookings = await listUpcomingCoachingBookings({ supabase, orgId: "org-1" })

    expect(calls.statusEq).toBe("confirmed")
    expect(calls.statusIn).toBeUndefined()
    expect(bookings).toHaveLength(1)
    expect(bookings[0]).toMatchObject({
      id: "confirmed-booking",
      status: "confirmed",
      coachName: "Joel & Paula",
    })
  })
})
