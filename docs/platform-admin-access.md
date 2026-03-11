# Platform Admin Access

Platform admins are the highest-privilege internal users in this app.

## What a Platform Admin Can Do

Today, platform admin access is controlled by:

- `profiles.role = "admin"`

That role unlocks:

- `/admin/platform`
- internal Supabase Platform Kit tools
- platform-only testing/devtools actions
- admin-only server actions guarded by `requireAdmin()`

This is broader than normal org roles like `owner`, `staff`, or `board`. Only give it to you and trusted internal team members.

## Recommended Setup Flow

For brand-new internal teammates:

1. Create or update a local manifest file that is **not committed**.
2. Run the provisioning script against the correct Supabase project.
3. Share temporary passwords securely with your team.
4. Have each person sign in and rotate their password immediately.

For existing accounts:

1. Add the user email to the manifest.
2. Omit `password` if you only want to promote them.
3. Include `password` if you want to reset it during promotion.

## Provision Multiple Platform Admins

Create a local JSON file like:

```json
[
  {
    "email": "you@example.com",
    "fullName": "Your Name",
    "password": "TempPass!123456"
  },
  {
    "email": "teammate@example.com",
    "fullName": "Teammate Name",
    "password": "TempPass!987654"
  }
]
```

Then run:

```bash
pnpm provision:admins -- --file ./platform-admins.local.json
```

Dry run first if you want to inspect what will happen:

```bash
pnpm provision:admins -- --file ./platform-admins.local.json --dry-run
```

Behavior:

- existing user + no password: promote to platform admin only
- existing user + password: promote and reset password
- missing user + password: create confirmed account and make them platform admin
- missing user + no password: fail closed

## Existing One-Off Commands

You still have these scripts:

- `pnpm create:admin`
  - create one brand-new admin user from env vars
- `pnpm promote:admin`
  - promote one existing user by email

The manifest-based provisioning flow is the better option for your team.

## Environment Requirements

These commands use the local machine environment and act directly against Supabase:

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Make sure those values point at the environment you actually intend to modify. If your local `.env.local` points at production, these commands affect production users.

## Operational Notes

- Keep the manifest file local and out of git.
- Use a password manager or another secure channel to share temporary passwords.
- Ask each admin to change their password after first login.
- Revoke platform admin access by changing `profiles.role` away from `admin` if someone should no longer have global access.
