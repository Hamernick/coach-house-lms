# Platform Staff Access

Platform staff are internal users. Their access is separate from subscriptions
and organization membership roles.

## What a Platform Admin Can Do

Platform access is controlled by `platform_staff_members.access_level`:

- `developer`: every internal tool and broad administrative RLS access.
- `coach`: Workspace, Find, and Organizations only.

`profiles.role = "admin"` remains a legacy developer mirror during the
transition. It does not define coach access.

Developer access unlocks:

- `/admin/platform`
- internal Supabase Platform Kit tools
- platform-only testing/devtools actions
- admin-only server actions guarded by `requireAdmin()`

Coach access is deliberately narrower and never satisfies `public.is_admin()`.
Both levels remain separate from org roles like `owner`, `staff`, or `board`.

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
    "password": "TempPass!123456",
    "accessLevel": "developer"
  },
  {
    "email": "teammate@example.com",
    "fullName": "Teammate Name",
    "password": "TempPass!987654",
    "accessLevel": "coach"
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

- existing user + no password: update platform access only
- existing user + password: update platform access and reset password
- missing user + password: create a confirmed account with the requested access
- missing user + no password: fail closed
- omitted `accessLevel`: default to `developer` for backward compatibility

## Existing One-Off Commands

You still have these scripts:

- `pnpm create:admin`
  - create one brand-new admin user from env vars
- `pnpm promote:admin`
  - set one existing user's access with `TARGET_ACCESS_LEVEL=developer|coach`

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
- Revoke internal access by deleting the user's `platform_staff_members` row.
- Change levels through the provisioner so the legacy profile-role mirror stays synchronized.
