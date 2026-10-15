import "server-only"

import { NextResponse } from "next/server"
import { z } from "zod"
import { sendResendEmail, canSendResendEmail } from "@/lib/email/resend"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { authorizeFiscalEmailCron } from "./staff-email-dispatch"
import { prepareGuestEmailProofLink } from "./guest-email-proof"
import { guestEmailProofSecret } from "./guest-email-proof-token"
import { guestReceiptCopy } from "../lib/guest-receipt-copy"

const jobSchema = z.object({
  id: z.string().uuid(), submissionId: z.string().uuid(), projectId: z.string().uuid(),
  kind: z.enum(["applicant_receipt", "reviewer_notification", "applicant_update", "reviewer_update", "applicant_recovery"]), recipient: z.string().email(), leaseToken: z.string().uuid(),
  receiptSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function dispatchFiscalGuestEmails() {
  if (process.env.FISCAL_GUEST_EMAILS_ENABLED !== "true" || !canSendResendEmail()) throw new Error("Guest email delivery is not configured")
  if (!guestEmailProofSecret()) throw new Error("Email verification is not configured")
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://coachhouse.app")
  if (site.protocol !== "https:") throw new Error("Guest email site must use HTTPS")
  const admin = createSupabaseAdminClient()
  let { data, error } = await admin.rpc("claim_fiscal_guest_emails_v3")
  // Missing migration only: do not retry a possibly committed queue claim after
  // network, permission or database failures. Legacy jobs retain their old copy.
  if (error?.code === "PGRST202" || error?.code === "42883") ({ data, error } = await admin.rpc("claim_fiscal_guest_emails"))
  if (error) throw new Error("Guest email queue unavailable")
  const jobs = z.array(jobSchema).parse(data)
  let sent = 0, failed = 0
  for (const job of jobs) {
    const recovery = job.kind === "applicant_recovery"
    const applicant = job.kind === "applicant_receipt" || job.kind === "applicant_update" || recovery
    const update = job.kind === "applicant_update" || job.kind === "reviewer_update"
    const url = new URL(`/projects/${job.projectId}`, site).toString()
    let result: Awaited<ReturnType<typeof sendResendEmail>>
    try {
      const copy = job.kind === "applicant_receipt" && job.receiptSnapshot ? guestReceiptCopy(job.receiptSnapshot) : null
      if (copy && String(job.receiptSnapshot!.primary_email).toLowerCase() !== job.recipient.toLowerCase()) throw new Error("Receipt recipient mismatch")
      const verificationUrl = applicant ? await prepareGuestEmailProofLink(job.id, job.leaseToken, site) : null
      // Frozen proof material and versioned copy keep retries byte-for-byte stable.
      const text = recovery
        ? `You requested access to your fiscal sponsorship application.\n\nReference: ${job.submissionId}\n\nVerify your email to view your application: ${verificationUrl}\n\nNo account is required. This private link expires in seven days. Opening it does not verify your email; choose Verify email on the page. If you did not request this link, you can ignore it. Your application has not changed.`
        : update
        ? applicant
          ? `Your fiscal sponsorship application has an update.\n\nReference: ${job.submissionId}\n\nVerify your email to view the current status and any requested corrections: ${verificationUrl}\n\nNo account is required. This private link expires in seven days. Opening it does not verify your email; choose Verify email on the page.`
          : `A fiscal sponsorship applicant has submitted requested corrections.\n\nReference: ${job.submissionId}\n\nReview the project: ${url}\n\nSign in with your Coach House staff account.`
        : applicant
        ? copy
          ? `We received your fiscal sponsorship application.\n\nReference: ${job.submissionId}\n\nYour application is submitted. No account or email confirmation is needed to submit. Coach House will review it and contact you. This receipt does not mean your project has been approved.\n\nCOPY OF YOUR SUBMITTED ANSWERS\n\n${copy}\n\nOptional: check status, respond to requested corrections or save details to a profile using this private link: ${verificationUrl}\n\nYou can read and keep this email without opening the link. For private online access, choose Verify email on the page. You can verify on your phone and return to the original browser where you applied. This access link expires in seven days; it does not create an account.`
          : `We received your fiscal sponsorship application.\n\nReference: ${job.submissionId}\n\nCoach House will review your application. This receipt does not mean your project has been approved. You do not need an account to apply.\n\nVerify your email: ${verificationUrl}\n\nThis private link expires in seven days. Opening it does not verify your email; choose Verify email on the page. Verification does not create an account.`
        : `A new fiscal sponsorship application is ready for review.\n\nReference: ${job.submissionId}\n\nReview the project: ${url}\n\nSign in with your Coach House staff account.`
      let html = `<div>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;").split("\n\n").map((paragraph) => `<p>${copy ? paragraph.replaceAll("\n", "<br />") : paragraph}</p>`).join("")}</div>`
      if (verificationUrl) html = html.replace(verificationUrl, `<a href="${verificationUrl}">Verify email</a>`)
      result = await sendResendEmail({
        to: job.recipient, subject: recovery ? "Your application access link" : update ? "Fiscal sponsorship application updated" : applicant ? "We received your application" : "New fiscal sponsorship application",
        text, html, signal: AbortSignal.timeout(8000), idempotencyKey: `fiscal-guest-${recovery ? "recovery-v1" : update ? "update-v1" : copy ? "receipt-v3" : "v2"}/${job.id}`,
        tags: [{ name: "category", value: applicant ? "fiscal-receipt" : "fiscal-review" }],
      })
    } catch { result = { ok: false, error: "provider_unavailable" } }
    const completion = await admin.rpc("finish_fiscal_guest_email", {
      p_id: job.id, p_lease_token: job.leaseToken, p_success: result.ok, p_message_id: result.ok ? result.id : null,
    })
    if (completion.error || completion.data !== true) throw new Error("Guest email delivery could not be recorded")
    if (result.ok) sent += 1
    else failed += 1
  }
  return { sent, failed }
}

export async function handleGuestFiscalEmailCron(request: Request) {
  if (!authorizeFiscalEmailCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try { return NextResponse.json(await dispatchFiscalGuestEmails(), { headers: { "Cache-Control": "no-store" } }) }
  catch { return NextResponse.json({ error: "Guest email delivery unavailable" }, { status: 503 }) }
}
