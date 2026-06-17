# Email Deliverability Audit — Apr 28, 2026

Scope: Apr 24 backlog item, “Email confirmation went to spam.”

## Current App State

- App-owned organization invite emails send through Resend in `src/lib/email/resend.ts`.
- The canonical Vercel/server env key is `RESEND_API_KEY`; the app also accepts
  `RESEND_AUTH_EMAIL_API_KEY` as a compatibility alias for the same Resend API key.
- Default app sender is `Coach House <hello@coachhouse.app>` unless `RESEND_FROM_EMAIL` or `RESEND_FROM_NAME` overrides it.
- Resend payloads omit `reply_to` unless `RESEND_REPLY_TO_EMAIL` or a per-send reply-to value is configured.
- Resend payloads only include `List-Unsubscribe` when a real configured unsubscribe email/URL or reply-to address exists; the code no longer hard-codes a fake unsubscribe inbox.
- Supabase auth lifecycle emails have branded template builders in `src/features/organization-access/lib/email-foundation.ts`.
- Admins can sync those Supabase Auth templates from `/admin/platform` through `syncSupabaseAuthEmailTemplatesAction`.

## DNS Findings

Checked live DNS for the default sender domain, `coachhouse.app`, on Apr 28, 2026:

- `coachhouse.app` TXT: no root TXT/SPF response.
- `_dmarc.coachhouse.app` TXT: `v=DMARC1; p=none;`
- `coachhouse.app` MX: no MX response.
- `resend._domainkey.coachhouse.app` TXT: DKIM public key exists.

Interpretation:

- DKIM appears present for Resend.
- DMARC exists, but it is monitoring-only and has no aggregate report destination.
- Root SPF was not found in DNS. Resend’s docs describe SPF and DKIM as the two required records for verifying a sending domain, and DMARC as the trust layer once SPF/DKIM are passing.
- No app-code change can force mailbox providers to inbox messages if sender authentication, sender reputation, or Supabase/Resend domain settings are incomplete.

References:

- Resend domain setup: https://resend.com/docs/dashboard/domains/introduction
- Resend DMARC guidance: https://resend.com/docs/dashboard/domains/dmarc

## Required External Follow-Up

1. Open Resend Domains for `coachhouse.app` and confirm domain status is verified.
2. Add or repair the exact SPF/MX return-path records Resend shows for the domain or chosen sending subdomain.
3. Update DMARC to include an aggregate report mailbox, for example `rua=mailto:dmarc@coachhouse.app` or a monitored DMARC-reporting address.
4. Confirm Supabase Auth is using either a custom SMTP provider with the same authenticated sender domain or an otherwise verified sender path.
5. Send a live confirmation email to Gmail/Google Workspace, inspect headers, and confirm `dkim=pass`, `spf=pass` or aligned SPF, and `dmarc=pass`.
6. After several successful test sends, consider tightening DMARC from `p=none` to `p=quarantine`, then eventually `p=reject` once all legitimate sources pass.

## Backlog Status

The in-app template/sender-code check is complete, and the app-owned Resend helper now defaults to `hello@coachhouse.app`. The remaining work is DNS/provider configuration and live inbox/header verification.

## Apr 29 Recheck

- `pnpm check:quality` passed end-to-end after the email helper changes.
- Live Supabase Auth config, read through the Management API with SMTP secrets redacted, is using `smtp_admin_email = no-reply@coachhouse.app` and `smtp_sender_name = Coach House`.
- Supabase Auth custom SMTP is configured (`smtp_host`, `smtp_user`, and `smtp_pass` are present but redacted); Supabase Auth confirmation/recovery/invite/magic-link/email-change/reauthentication subjects match the Coach House templates.
- Supabase Auth `site_url` is `https://coachhouse.app`; redirect allow-list includes `https://coachhouse.app/auth/callback`, the prior Vercel callback/wildcard entries, and local development callbacks.
- Vercel metadata now confirms the production domain is served by project `calebs-projects-58ab1538/coachhouse`; the earlier `caleb-hamernicks-projects/coach-house-platform` project is not the canonical production target. App-owned Resend invites should use the `coachhouse` project environment, where `RESEND_AUTH_EMAIL_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_REPLY_TO_EMAIL` are configured for production.
