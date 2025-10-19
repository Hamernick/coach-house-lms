#!/usr/bin/env bash
set -euo pipefail

# Usage: SUPABASE_DB_URL=postgres://... ./scripts/export_schema.sh
# Creates a dated snapshot and refreshes db/current/*

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL=postgres://...}"

STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
OUT="db/snapshots/$STAMP"
CUR="db/current"

mkdir -p "$OUT" "$CUR"

# 1) Full schema (DDL), including grants; no owners to keep diffs clean.
pg_dump "$SUPABASE_DB_URL" \
  --schema-only \
  --no-owner \
  --format=p \
  -n public -n storage -n auth \
  > "$OUT/schema.sql"

# 2) Functions & triggers (dumped as DDL; pg_dump includes them in schema.sql,
#    but we also extract a focused view for code review ergonomics).
pg_dump "$SUPABASE_DB_URL" \
  --schema-only \
  --no-owner \
  --format=p \
  --section=post-data \
  -n public -n storage -n auth \
  > "$OUT/functions_triggers.sql"

# 3) RLS policies (pretty DDL reconstructed from catalogs for quick reading).
psql "$SUPABASE_DB_URL" -X -A -t -F '' <<'SQL' > "$OUT/rls_policies.sql"
WITH pol AS (
  SELECT
    n.nspname                           AS schema_name,
    c.relname                           AS table_name,
    p.polname                           AS policy_name,
    p.polcmd                            AS cmd,            -- r/w/a
    pg_get_expr(p.polqual, p.polrelid)  AS using_expr,
    pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr,
    CASE p.polroles
      WHEN '{0}' THEN 'PUBLIC'
      ELSE (SELECT string_agg(quote_ident(rolname), ', ')
            FROM pg_roles WHERE oid = ANY(p.polroles))
    END AS roles
  FROM pg_policy p
  JOIN pg_class  c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public','storage','auth')
)
SELECT
  'CREATE POLICY ' || quote_ident(policy_name) ||
  ' ON ' || quote_ident(schema_name) || '.' || quote_ident(table_name) ||
  ' FOR ' || CASE cmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'a' THEN 'INSERT'
                WHEN 'd' THEN 'DELETE'
                ELSE 'ALL'
             END ||
  ' TO ' || roles ||
  COALESCE(' USING (' || using_expr || ')', '') ||
  COALESCE(' WITH CHECK (' || check_expr || ')', '') || ';' || E'\n'
FROM pol
ORDER BY schema_name, table_name, policy_name;
SQL

# 4) RLS flags per table (which tables have row security ON)
psql "$SUPABASE_DB_URL" -X -A -F $'\t' -P footer=off <<'SQL' > "$OUT/rls_tables.tsv"
schema	table	row_level_security	force_rls
SELECT n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname IN ('public','storage','auth')
ORDER BY 1,2;
SQL

# 5) Types for TypeScript (great for Codex)
supabase gen types typescript --db-url "$SUPABASE_DB_URL" > "$OUT/types.ts"

# 6) Update "current" pointers
cp "$OUT/schema.sql"            "$CUR/schema.sql"
cp "$OUT/functions_triggers.sql" "$CUR/functions_triggers.sql"
cp "$OUT/rls_policies.sql"      "$CUR/rls_policies.sql"
cp "$OUT/rls_tables.tsv"        "$CUR/rls_tables.tsv"
cp "$OUT/types.ts"              "$CUR/types.ts"

echo "Exported to $OUT and refreshed $CUR"

