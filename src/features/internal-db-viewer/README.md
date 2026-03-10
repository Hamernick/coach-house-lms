# Internal DB Viewer Feature

Secure, read-only internal DB viewer for authorized teammates.

## Security model
- Route requires authenticated session.
- Access requires either:
  - `profiles.role = "admin"`, or
  - email included in `INTERNAL_DB_VIEWER_ALLOWED_EMAILS`.
- Unauthorized users receive `404` to keep the route non-discoverable.
- Data reads use service-role client only after server-side access check.
- Viewer can only query tables listed in `INTERNAL_DB_VIEWER_TABLES`.

## Route
- Hidden route path: `/db-viewer`
- Route wrapper: `src/app/(dashboard)/db-viewer/page.tsx`

## Configuration
- `INTERNAL_DB_VIEWER_ALLOWED_EMAILS` (comma-separated)
- `INTERNAL_DB_VIEWER_TABLES` (comma-separated table names)
