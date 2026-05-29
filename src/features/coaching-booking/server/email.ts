import { sendResendEmail } from "@/lib/email/resend"
import { env } from "@/lib/env"
import {
  COACHING_JOINT_COACH_LABEL,
  COACHING_PATH,
  getValidGoogleCalendarEventUrl,
  getValidGoogleMeetUrl,
} from "../lib"

type CoachingBookingEmailInput = {
  attendeeEmail: string | null
  coachEmails: string[]
  startsAt: string
  endsAt: string
  timezone: string
  googleEventHtmlLink: string | null
  googleMeetUrl: string | null
  bookingId: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function resolveSiteUrl() {
  return (
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://coachhouse.app"
  ).replace(/\/+$/, "")
}

function formatBookingWindow({
  startsAt,
  endsAt,
  timezone,
}: {
  startsAt: string
  endsAt: string
  timezone: string
}) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(start)
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(start)
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(end)

  return `${date}, ${time} to ${endTime}`
}

function dedupeEmails(emails: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return emails
    .map((email) => email?.trim() ?? "")
    .filter((email) => email.length > 0)
    .filter((email) => {
      const key = email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function buildEmailHtml({
  heading,
  intro,
  details,
  actions,
}: {
  heading: string
  intro: string
  details: string[]
  actions: Array<{ label: string; url: string }>
}) {
  const escapedHeading = escapeHtml(heading)
  const escapedIntro = escapeHtml(intro)
  const detailItems = details
    .map((detail) => `<li>${escapeHtml(detail)}</li>`)
    .join("")
  const actionLinks = actions
    .map(
      (action) =>
        `<p><a href="${escapeHtml(action.url)}">${escapeHtml(action.label)}</a></p>`,
    )
    .join("")

  return [
    "<!doctype html>",
    '<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">',
    `<h1 style="font-size:20px;line-height:1.3;">${escapedHeading}</h1>`,
    `<p>${escapedIntro}</p>`,
    `<ul>${detailItems}</ul>`,
    actionLinks,
    "</body></html>",
  ].join("")
}

function buildEmailText({
  heading,
  intro,
  details,
  actions,
}: {
  heading: string
  intro: string
  details: string[]
  actions: Array<{ label: string; url: string }>
}) {
  return [
    heading,
    "",
    intro,
    "",
    ...details.map((detail) => `- ${detail}`),
    "",
    ...actions.map((action) => `${action.label}: ${action.url}`),
  ].join("\n")
}

export async function sendCoachingBookingConfirmationEmails({
  attendeeEmail,
  coachEmails,
  startsAt,
  endsAt,
  timezone,
  googleEventHtmlLink,
  googleMeetUrl,
  bookingId,
}: CoachingBookingEmailInput) {
  const siteUrl = resolveSiteUrl()
  const coachingUrl = `${siteUrl}${COACHING_PATH}`
  const calendarUrl = getValidGoogleCalendarEventUrl(googleEventHtmlLink)
  const meetUrl = getValidGoogleMeetUrl(googleMeetUrl)
  const when = formatBookingWindow({ startsAt, endsAt, timezone })
  const attendeeRecipients = dedupeEmails([attendeeEmail])
  const coachRecipients = dedupeEmails(coachEmails)
  const sharedActions = [
    ...(calendarUrl ? [{ label: "Open Google Calendar invite", url: calendarUrl }] : []),
    ...(meetUrl ? [{ label: "Join Google Meet", url: meetUrl }] : []),
    { label: "Open Coaching", url: coachingUrl },
  ]

  const sends = []
  if (attendeeRecipients.length > 0) {
    const details = [
      `Session: Coach House session with ${COACHING_JOINT_COACH_LABEL}`,
      `When: ${when}`,
      `Timezone: ${timezone}`,
    ]
    sends.push(
      sendResendEmail({
        to: attendeeRecipients,
        subject: "Your Coach House coaching session is confirmed",
        html: buildEmailHtml({
          heading: "Your coaching session is confirmed",
          intro: "Your Coach House coaching session has been booked.",
          details,
          actions: sharedActions,
        }),
        text: buildEmailText({
          heading: "Your coaching session is confirmed",
          intro: "Your Coach House coaching session has been booked.",
          details,
          actions: sharedActions,
        }),
        tags: [
          { name: "category", value: "coaching-booking-confirmed" },
          { name: "booking", value: bookingId },
        ],
      }),
    )
  }

  if (coachRecipients.length > 0) {
    const details = [
      `Session: Coach House session with ${COACHING_JOINT_COACH_LABEL}`,
      `When: ${when}`,
      `Timezone: ${timezone}`,
      ...(attendeeEmail ? [`Attendee: ${attendeeEmail}`] : []),
    ]
    sends.push(
      sendResendEmail({
        to: coachRecipients,
        subject: "New Coach House coaching session booked",
        html: buildEmailHtml({
          heading: "New coaching session booked",
          intro: "A Coach House coaching session has been confirmed.",
          details,
          actions: sharedActions,
        }),
        text: buildEmailText({
          heading: "New coaching session booked",
          intro: "A Coach House coaching session has been confirmed.",
          details,
          actions: sharedActions,
        }),
        tags: [
          { name: "category", value: "coaching-booking-coach-notice" },
          { name: "booking", value: bookingId },
        ],
      }),
    )
  }

  const results = await Promise.all(sends)
  const failed = results.filter((result) => !result.ok)
  if (failed.length > 0) {
    console.error("Failed to send coaching booking email", {
      bookingId,
      errors: failed.map((result) => ("error" in result ? result.error : "unknown_error")),
    })
  }
}
