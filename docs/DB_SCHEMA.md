# Database schema overview

This repository uses Supabase (Postgres) for persistence. The canonical migration
lives in `supabase/migrations/20250108150000_bootstrap_schema.sql` and creates the
following entities:

- `profiles`: 1:1 with `auth.users` and augmented with role metadata
- `classes`: course container with publish state and Stripe linkage
- `modules`: ordered lessons linked to `classes`
- `enrollments`: join table mapping learners to classes
- `module_progress`: per-module learner progress with completion metadata
- `subscriptions`: billing and entitlement state mirrored from Stripe

All tables have RLS enabled. Helper function `public.is_admin()` powers admin
policies. Students (default role) can only access their own records and published
content; admins (role `admin`) can manage everything.

## Local workflow

1. Apply migrations: `supabase db push` (or run the SQL manually against your
   Postgres instance).
2. Seed sample data: `psql $DATABASE_URL -f supabase/seed.sql`.
3. Run RLS tests (requires a live Supabase project or local stack):
   ```bash
   SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \\
   SUPABASE_SERVICE_ROLE_KEY=... npm run test:rls
   ```
   The script provisions temporary users, verifies policies, and cleans up.

Update `src/lib/supabase/types.ts` whenever the schema changes so TypeScript infers
end-to-end types.
