# Organization coach scoping implementation plan

1. Add the versioned scope-setting and audit-event migration, security-definer
   activation RPC, forced RLS, grants, and generated TypeScript table/function
   contracts.
2. Extend the organization coach assignment feature with scope types, pure
   access helpers, scope loaders, and a developer-only server action.
3. Load scope into the member-workspace actor context. Filter platform
   organization lists before canonical project synchronization and deny
   unassigned coach detail requests.
4. Apply the same organization check to every internal organization mutation
   path that uses the service-role actor.
5. Extend the assignment operations bar with readiness, activation, rollback,
   confirmation, pending, and error states. Prevent intentional unassignment
   while scoping is active.
6. Add focused acceptance and RLS coverage, append the monthly runlog, and run
   `pnpm check:quality` before packaging the release.
7. Merge and deploy with assigned-only scoping disabled. Verify production
   routes, database setting, audit permissions, assignment coverage, and
   rollback readiness. Do not activate until production unassigned count is
   zero.
