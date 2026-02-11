# Email Confirmation Template

## Subject Line
`Confirm your email to get started with Coach House`

## Optional Preview Text
`One quick click and your account will be ready.`

## HTML Template
Use this in your email provider's HTML template field.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm your email</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;color:#111827;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 10px 28px;" align="left">
                <img
                  src="{{ .SiteURL }}/coach-house-logo-light.png"
                  alt="Coach House"
                  width="140"
                  style="display:block;border:0;outline:none;text-decoration:none;height:auto;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0 28px;">
                <h1 style="margin:0;font-size:26px;line-height:1.25;color:#111827;font-weight:700;">
                  Confirm your email
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 0 28px;">
                <p style="margin:0;font-size:16px;line-height:1.6;color:#374151;">
                  Welcome to Coach House. Please confirm your email so we can finish setting up your account.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 0 28px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:13px 18px;border-radius:10px;"
                >
                  Confirm email
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0 28px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>
                <p style="margin:8px 0 0 0;word-break:break-all;font-size:13px;line-height:1.5;color:#111827;">
                  {{ .ConfirmationURL }}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px 28px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                  If you didn’t create an account, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Plain Text Fallback

```txt
Coach House

Confirm your email

Welcome to Coach House. Please confirm your email so we can finish setting up your account.

Confirm email:
{{ .ConfirmationURL }}

If you didn’t create an account, you can safely ignore this email.
```

## Notes
- The template uses Supabase-style placeholder `{{ .ConfirmationURL }}`.
- Logo URL now points to your app asset path via Supabase `{{ .SiteURL }}`: `{{ .SiteURL }}/coach-house-logo-light.png`.
- If your email provider uses a different placeholder format, replace `{{ .ConfirmationURL }}` accordingly.
