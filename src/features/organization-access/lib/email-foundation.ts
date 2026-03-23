import {
  formatOrganizationAccessRoleLabel,
  type OrganizationAccessRole,
} from "./notification-metadata"

export type CoachHouseEmailPreview = {
  id: string
  family: "app" | "supabase-auth"
  category: string
  title: string
  subject: string
  previewText: string
  description: string
  html: string
}

type EmailStat = {
  label: string
  value: string
}

type EmailTemplateInput = {
  logoUrl: string
  eyebrow: string
  title: string
  intro: string
  body: string[]
  ctaLabel: string
  ctaHref: string
  helpText: string
  footer: string
  previewText: string
  stats?: EmailStat[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderStats(stats: EmailStat[] | undefined) {
  if (!stats || stats.length === 0) return ""

  return `
    <tr>
      <td style="padding:20px 28px 0 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            ${stats
              .map(
                (stat) => `
                  <td valign="top" style="width:${100 / stats.length}%;padding-right:8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;">
                      <tr>
                        <td style="padding:14px 14px 12px 14px;">
                          <div style="font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">
                            ${escapeHtml(stat.label)}
                          </div>
                          <div style="padding-top:8px;font-size:18px;line-height:1.2;color:#0f172a;font-weight:700;">
                            ${escapeHtml(stat.value)}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                `,
              )
              .join("")}
          </tr>
        </table>
      </td>
    </tr>
  `
}

export function renderCoachHouseEmailHtml(input: EmailTemplateInput) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f1;color:#0f172a;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(input.previewText)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f1;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #ddd7cf;border-radius:22px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 0 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #ddd7cf;border-radius:16px;background:#faf8f4;">
                  <tr>
                    <td style="padding:12px 14px;">
                      <img src="${escapeHtml(input.logoUrl)}" alt="Coach House" width="132" style="display:block;border:0;outline:none;text-decoration:none;height:auto;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 0 28px;">
                <div style="display:inline-block;border-radius:999px;background:#f2ede5;padding:6px 10px;font-size:11px;line-height:1.2;letter-spacing:0.08em;text-transform:uppercase;color:#6b665f;font-weight:700;">
                  ${escapeHtml(input.eyebrow)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 0 28px;">
                <h1 style="margin:0;font-size:30px;line-height:1.15;letter-spacing:-0.02em;color:#0f172a;font-weight:700;">
                  ${escapeHtml(input.title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 0 28px;">
                <p style="margin:0;font-size:17px;line-height:1.7;color:#334155;">
                  ${escapeHtml(input.intro)}
                </p>
              </td>
            </tr>
            ${renderStats(input.stats)}
            <tr>
              <td style="padding:20px 28px 0 28px;">
                ${input.body
                  .map(
                    (paragraph) => `
                      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#475569;">
                        ${escapeHtml(paragraph)}
                      </p>
                    `,
                  )
                  .join("")}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 28px 0 28px;">
                <a href="${escapeHtml(input.ctaHref)}" style="display:inline-block;border-radius:14px;background:#0f172a;padding:14px 18px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;">
                  ${escapeHtml(input.ctaLabel)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0 28px;">
                <div style="border:1px solid #e5e7eb;border-radius:16px;background:#f8fafc;padding:14px 16px;">
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
                    ${escapeHtml(input.helpText)}
                  </p>
                  <p style="margin:10px 0 0 0;word-break:break-all;font-size:12px;line-height:1.7;color:#0f172a;">
                    ${escapeHtml(input.ctaHref)}
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px 28px;">
                <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                  ${escapeHtml(input.footer)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

type PreviewSeed = {
  siteUrl: string
  organizationName: string
}

function resolveLogoUrl(siteUrl: string) {
  return `${siteUrl.replace(/\/$/, "")}/coach-house-logo-light.png`
}

export function buildOrganizationInviteEmailPreview({
  siteUrl,
  organizationName,
}: PreviewSeed): CoachHouseEmailPreview {
  const joinUrl = `${siteUrl.replace(/\/$/, "")}/join-organization?token=preview-token`

  return {
    id: "organization-external-invite",
    family: "app",
    category: "Invites",
    title: "Organization invite",
    subject: `Join ${organizationName} on Coach House`,
    previewText: `Accept your Coach House invite to join ${organizationName}.`,
    description:
      "Custom app-owned invite email for people who do not have an account yet.",
    html: renderCoachHouseEmailHtml({
      logoUrl: resolveLogoUrl(siteUrl),
      eyebrow: "Organization invite",
      title: `Join ${organizationName} on Coach House`,
      intro:
        "You’ve been invited to create your account and step into the organization workspace.",
      body: [
        `${organizationName} is using Coach House to keep plans, operations, and team context in one place.`,
        "Create your account first, then we’ll take you straight into the final join step.",
      ],
      ctaLabel: "Create account and join",
      ctaHref: joinUrl,
      helpText: "If the button does not open correctly, paste this link into your browser.",
      footer:
        "If you were not expecting this invite, you can safely ignore this message.",
      previewText: `Accept your Coach House invite to join ${organizationName}.`,
      stats: [
        { label: "Access", value: "Team invite" },
        { label: "Role", value: "Workspace editor" },
      ],
    }),
  }
}

export function buildExistingUserRequestEmailPreview({
  siteUrl,
  organizationName,
  reviewUrl = `${siteUrl.replace(/\/$/, "")}/access-requests`,
}: PreviewSeed & { reviewUrl?: string }): CoachHouseEmailPreview {
  return {
    id: "organization-existing-user-request",
    family: "app",
    category: "Invites",
    title: "Existing user request",
    subject: `${organizationName} invited you to Coach House access`,
    previewText: `Review the access request from ${organizationName} inside your Coach House account.`,
    description:
      "Heads-up email for an existing Coach House user who should accept or decline inside notifications.",
    html: renderCoachHouseEmailHtml({
      logoUrl: resolveLogoUrl(siteUrl),
      eyebrow: "Access request",
      title: `${organizationName} invited you to collaborate`,
      intro:
        "There’s a new access request waiting for you in Coach House notifications.",
      body: [
        "Open your account to review the request and choose whether to accept or decline it.",
        "This keeps access decisions tied to your existing Coach House identity instead of a separate invite link.",
      ],
      ctaLabel: "Review request",
      ctaHref: reviewUrl,
      helpText: "Sign in with your existing Coach House account to respond.",
      footer:
        "If this wasn’t expected, no action is required and you can ignore this email.",
      previewText: `Review the access request from ${organizationName} inside your Coach House account.`,
      stats: [
        { label: "Action", value: "Accept or decline" },
        { label: "Location", value: "Notifications" },
      ],
    }),
  }
}

type SupabaseAuthEmailTemplateInput = {
  id: string
  title: string
  subject: string
  previewText: string
  description: string
  eyebrow: string
  ctaLabel: string
  ctaHref: string
  intro: string
  body: string[]
  footer: string
}

function buildSupabaseAuthEmailTemplate(
  siteUrl: string,
  input: SupabaseAuthEmailTemplateInput,
): CoachHouseEmailPreview {
  return {
    id: input.id,
    family: "supabase-auth",
    category: "Auth emails",
    title: input.title,
    subject: input.subject,
    previewText: input.previewText,
    description: input.description,
    html: renderCoachHouseEmailHtml({
      logoUrl: resolveLogoUrl(siteUrl),
      eyebrow: input.eyebrow,
      title: input.title,
      intro: input.intro,
      body: input.body,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      helpText: "If the button does not work, paste this link into your browser.",
      footer: input.footer,
      previewText: input.previewText,
      stats: [
        { label: "Security", value: "Verified" },
        { label: "Channel", value: "Email" },
      ],
    }),
  }
}

export function buildSupabaseAuthEmailPreviews(
  siteUrl: string,
): CoachHouseEmailPreview[] {
  return [
    buildSupabaseAuthEmailTemplate(siteUrl, {
      id: "supabase-confirm-sign-up",
      title: "Confirm your email",
      subject: "Confirm your email to get started with Coach House",
      previewText: "One quick click and your account will be ready.",
      description: "Supabase confirmation email used after sign up.",
      eyebrow: "Confirm sign up",
      ctaLabel: "Confirm email",
      ctaHref: "{{ .ConfirmationURL }}",
      intro:
        "Welcome to Coach House. Confirm your email so we can finish setting up your account.",
      body: [
        "This keeps access secure and makes sure we’re sending updates to the right place.",
      ],
      footer: "If you didn’t create an account, you can safely ignore this email.",
    }),
    buildSupabaseAuthEmailTemplate(siteUrl, {
      id: "supabase-invite-user",
      title: "Accept your Coach House invite",
      subject: "You’ve been invited to Coach House",
      previewText: "Create your account and finish setting up your access.",
      description:
        "Supabase invite-user email for account creation flows that redirect into the organization join step.",
      eyebrow: "Invite user",
      ctaLabel: "Accept invite",
      ctaHref: "{{ .ConfirmationURL }}",
      intro:
        "You’ve been invited to create your Coach House account and continue into a shared workspace.",
      body: [
        "Use the secure link below to finish account setup. We’ll take you to the next step automatically.",
      ],
      footer: "If this invite wasn’t meant for you, you can ignore this message.",
    }),
    buildSupabaseAuthEmailTemplate(siteUrl, {
      id: "supabase-magic-link",
      title: "Your secure sign in link",
      subject: "Sign in to Coach House",
      previewText: "Use this one-time link to securely sign in.",
      description: "Supabase magic-link email for passwordless sign in.",
      eyebrow: "Magic link",
      ctaLabel: "Sign in",
      ctaHref: "{{ .ConfirmationURL }}",
      intro: "Use this secure one-time link to sign in to Coach House.",
      body: [
        "The link expires automatically, so use it soon and only on a device you trust.",
      ],
      footer: "If you didn’t request this sign-in link, no action is required.",
    }),
    buildSupabaseAuthEmailTemplate(siteUrl, {
      id: "supabase-change-email",
      title: "Confirm your new email",
      subject: "Confirm your new Coach House email address",
      previewText: "Verify your new address to finish the update.",
      description: "Supabase email-change verification template.",
      eyebrow: "Change email address",
      ctaLabel: "Confirm new email",
      ctaHref: "{{ .ConfirmationURL }}",
      intro:
        "Confirm your new email address so we can finish updating your Coach House account.",
      body: [
        "Once confirmed, future sign-ins and account notices will use this new address.",
      ],
      footer: "If you didn’t request this change, you can ignore this email.",
    }),
    buildSupabaseAuthEmailTemplate(siteUrl, {
      id: "supabase-reset-password",
      title: "Reset your password",
      subject: "Reset your Coach House password",
      previewText: "Choose a new password with this secure reset link.",
      description: "Supabase recovery email template.",
      eyebrow: "Reset password",
      ctaLabel: "Reset password",
      ctaHref: "{{ .ConfirmationURL }}",
      intro:
        "Use the secure link below to choose a new password for your Coach House account.",
      body: [
        "For security, the link expires automatically. If you still need help after that, request another reset email.",
      ],
      footer: "If you didn’t request a password reset, you can safely ignore this message.",
    }),
    buildSupabaseAuthEmailTemplate(siteUrl, {
      id: "supabase-reauthentication",
      title: "Confirm this secure action",
      subject: "Confirm your Coach House security check",
      previewText: "Use this link to continue a sensitive action securely.",
      description: "Supabase reauthentication template for sensitive actions.",
      eyebrow: "Reauthentication",
      ctaLabel: "Continue securely",
      ctaHref: "{{ .ConfirmationURL }}",
      intro: "Before we continue, we need to confirm it’s really you.",
      body: [
        "Use the link below to finish this secure step. It expires automatically for your protection.",
      ],
      footer: "If you didn’t request this action, you can ignore this email.",
    }),
  ]
}

export function buildOrganizationAccessEmailPreviews(siteUrl: string) {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "")
  const organizationName = "South Side Renewal Initiative"

  return [
    buildOrganizationInviteEmailPreview({
      siteUrl: normalizedSiteUrl,
      organizationName,
    }),
    buildExistingUserRequestEmailPreview({
      siteUrl: normalizedSiteUrl,
      organizationName,
    }),
    ...buildSupabaseAuthEmailPreviews(normalizedSiteUrl),
  ]
}

export function buildOrganizationAccessRequestEmailSubject({
  organizationName,
}: {
  organizationName: string
}) {
  return `${organizationName} invited you to Coach House access`
}

export function buildOrganizationAccessRequestEmailHtml({
  siteUrl,
  organizationName,
  reviewUrl,
}: {
  siteUrl: string
  organizationName: string
  reviewUrl: string
}) {
  return buildExistingUserRequestEmailPreview({
    siteUrl,
    organizationName,
    reviewUrl,
  }).html
}

export function buildOrganizationInviteEmailSubject({
  organizationName,
  role,
}: {
  organizationName: string
  role: OrganizationAccessRole
}) {
  return `Join ${organizationName} as ${formatOrganizationAccessRoleLabel(role)} on Coach House`
}

export function buildOrganizationInviteEmailHtml({
  siteUrl,
  organizationName,
  role,
  joinUrl,
}: {
  siteUrl: string
  organizationName: string
  role: OrganizationAccessRole
  joinUrl: string
}) {
  return renderCoachHouseEmailHtml({
    logoUrl: resolveLogoUrl(siteUrl),
    eyebrow: "Organization invite",
    title: `Join ${organizationName} on Coach House`,
    intro:
      "You’ve been invited to create your account and step into the organization workspace.",
    body: [
      `${organizationName} is ready for you inside Coach House.`,
      `Your access will open as ${formatOrganizationAccessRoleLabel(role)} once you finish the secure join step.`,
    ],
    ctaLabel: "Create account and join",
    ctaHref: joinUrl,
    helpText: "If the button does not open correctly, paste this link into your browser.",
    footer:
      "If you were not expecting this invite, you can safely ignore this message.",
    previewText: `Accept your Coach House invite to join ${organizationName}.`,
    stats: [
      { label: "Access", value: "Organization" },
      { label: "Role", value: formatOrganizationAccessRoleLabel(role) },
    ],
  })
}
