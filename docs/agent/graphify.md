# Graphify Workflow

Use one repository-root graph so application, tests, scripts, and Supabase stay
connected. `.graphifyignore` removes generated, deprecated, binary, historical,
and vendor noise. Do not split the graph by `src/**` subdirectory.

## First Build

Install the SQL parser so Supabase migrations and RLS tests are represented:

```bash
uv tool install --upgrade 'graphifyy[sql]'
```

Build the deterministic code layer, then label communities and generate the
report without a full-node HTML visualization:

```bash
graphify extract . --code-only --timing
graphify cluster-only . --no-viz
```

Then invoke `$graphify . --update` in Codex to add the allowlisted documentation
semantic layer. This uses the checked project skill and requires no API key.

## Daily Use

Query before reading broad source trees:

```bash
graphify query "<question>"
graphify path "<concept-a>" "<concept-b>"
graphify explain "<concept>"
```

After code changes, run `graphify update .`. After documentation changes, invoke
`$graphify . --update` so semantic nodes are refreshed.

## Repository Policy

`graphify-out/` stays local and ignored. The full graph exceeds the repository's
tracked-file budget and would create large Git diffs after routine updates.
Do not install Graphify's shared post-commit hook by default; this repository
uses many worktrees, and the hook would rebuild separately in each one.
