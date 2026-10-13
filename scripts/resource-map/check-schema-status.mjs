#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js"

import { loadLocalEnv } from "./lib/env.mjs"

const REQUIRED_RELATIONS = [
  {
    name: "resource_map_sources",
    columns: ["id", "slug", "name", "source_type", "trust_level", "metadata"],
  },
  {
    name: "resource_map_import_batches",
    columns: ["id", "source_id", "status", "row_count", "error_log"],
  },
  {
    name: "resource_map_ingestion_runs",
    columns: [
      "id",
      "run_id",
      "source_id",
      "run_kind",
      "connector_type",
      "status",
      "started_at",
      "finished_at",
      "fetched_count",
      "parsed_count",
      "normalized_count",
      "classified_count",
      "deduped_count",
      "flagged_count",
      "errors",
    ],
  },
  {
    name: "resource_map_raw_ingestion_records",
    columns: [
      "id",
      "source_id",
      "run_id",
      "raw_url",
      "raw_payload",
      "raw_text",
      "content_type",
      "checksum",
      "fetched_at",
      "parser_version",
      "connector_version",
      "fetch_status",
      "error_message",
    ],
  },
  {
    name: "resource_map_import_records",
    columns: [
      "id",
      "source_id",
      "batch_id",
      "raw_snapshot",
      "extracted_fields",
      "field_confidence",
      "trust_score",
      "freshness_score",
      "quality_flags",
      "reason_codes",
      "needs_review",
      "review_status",
      "duplicate_match_status",
      "promotion_status",
      "promoted_organization_id",
      "promoted_service_id",
      "raw_ingestion_record_id",
    ],
  },
  {
    name: "resource_map_categories",
    columns: [
      "key",
      "label",
      "parent_key",
      "marker_color",
      "icon_name",
      "aliases",
    ],
  },
  {
    name: "resource_map_organizations",
    columns: [
      "id",
      "platform_org_id",
      "source_id",
      "name",
      "visibility",
      "review_status",
      "approved_at",
      "hidden_at",
      "suppressed_at",
      "deleted_at",
    ],
  },
  {
    name: "resource_map_services",
    columns: [
      "id",
      "organization_id",
      "source_id",
      "title",
      "visibility",
      "review_status",
      "approved_at",
      "hidden_at",
      "suppressed_at",
      "deleted_at",
      "hours",
      "timezone",
      "appointment_required",
      "availability_status",
      "temporary_closed_until",
    ],
  },
  {
    name: "resource_map_service_categories",
    columns: ["service_id", "category_key", "is_primary", "confidence"],
  },
  {
    name: "resource_map_locations",
    columns: [
      "id",
      "organization_id",
      "service_id",
      "latitude",
      "longitude",
      "geo_point",
      "service_radius_miles",
      "hours",
      "timezone",
      "appointment_required",
      "availability_status",
      "temporary_closed_until",
    ],
  },
  {
    name: "resource_map_contacts",
    columns: [
      "id",
      "organization_id",
      "service_id",
      "contact_type",
      "is_public",
    ],
  },
  {
    name: "resource_map_links",
    columns: ["id", "organization_id", "service_id", "link_type", "is_public"],
  },
  {
    name: "resource_map_import_record_matches",
    columns: ["id", "import_record_id", "match_status", "match_score"],
  },
  {
    name: "resource_map_field_evidence",
    columns: [
      "id",
      "import_record_id",
      "field_path",
      "confidence_score",
      "evidence_type",
      "derived_from",
      "transformation",
      "evidence_metadata",
    ],
  },
  {
    name: "resource_map_curation_events",
    columns: [
      "id",
      "action",
      "actor_id",
      "reason",
      "before_state",
      "after_state",
    ],
  },
  {
    name: "public_map_organization_curation_events",
    columns: [
      "id",
      "organization_id",
      "actor_id",
      "action",
      "reason",
      "before_state",
      "after_state",
    ],
  },
  {
    name: "resource_map_public_items",
    columns: [
      "item_id",
      "service_id",
      "title",
      "organization_name",
      "resource_categories",
      "primary_resource_category",
      "latitude",
      "longitude",
      "public_contacts",
      "public_links",
      "timezone",
      "appointment_required",
      "availability_status",
      "temporary_closed_until",
      "location_hours",
    ],
  },
]

const PUBLIC_RPC_ARGS = {
  p_query: null,
  p_category_keys: null,
  p_limit: 1,
  p_latitude: null,
  p_longitude: null,
  p_radius_miles: null,
}

const USAGE =
  "Usage: pnpm resource-map:schema-status -- [--json] [--pretty] [--strict]"

function parseArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--") continue
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      args.set(key, true)
    } else {
      args.set(key, next)
      i += 1
    }
  }
  return args
}

function resolveEnv() {
  loadLocalEnv()

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRole) {
    throw new Error(
      "Set SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  return { url, anonKey, serviceRole }
}

function createReadOnlyClient(url, key) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isMissingSchemaError(error) {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase()
  return (
    text.includes("42p01") ||
    text.includes("pgrst202") ||
    text.includes("pgrst204") ||
    text.includes("pgrst205") ||
    text.includes("could not find") ||
    text.includes("column") ||
    text.includes("does not exist") ||
    text.includes("schema cache")
  )
}

function buildCheck(name, kind, error) {
  if (!error) return { name, kind, status: "ok" }

  return {
    name,
    kind,
    status: isMissingSchemaError(error) ? "missing" : "error",
    code: error.code ?? null,
    message: error.message ?? String(error),
  }
}

async function checkRelation(admin, relation) {
  const { error } = await admin
    .from(relation.name)
    .select(relation.columns.join(","))
    .limit(1)
  const check = buildCheck(relation.name, "relation", error)
  return { ...check, columns: relation.columns }
}

async function checkPublicView(anon) {
  const { error } = await anon
    .from("resource_map_public_items")
    .select("item_id")
    .limit(1)
  return buildCheck("anon resource_map_public_items", "public_view", error)
}

async function checkPublicRpc(anon) {
  const { error } = await anon.rpc(
    "get_resource_map_public_items",
    PUBLIC_RPC_ARGS
  )
  return buildCheck("anon get_resource_map_public_items", "public_rpc", error)
}

function summarize(checks) {
  const missing = checks.filter((check) => check.status === "missing")
  const errors = checks.filter((check) => check.status === "error")
  return {
    ready: missing.length === 0 && errors.length === 0,
    missing: missing.length,
    errors: errors.length,
    checked: checks.length,
    checks,
  }
}

function printText(summary) {
  console.log("Resource map schema status")
  console.log("Read-only: no migration, import, upload, or publish was run.")
  console.log("")

  for (const check of summary.checks) {
    const suffix = check.message ? ` - ${check.message}` : ""
    console.log(`${check.status.padEnd(7)} ${check.name}${suffix}`)
  }

  console.log("")
  if (summary.ready) {
    console.log("Ready: connected Supabase has the resource-map read contract.")
    return
  }

  console.log(
    `Not ready: ${summary.missing} missing and ${summary.errors} errored checks.`
  )
  console.log(
    "Run `pnpm resource-map:schema-setup-sql` to print the missing schema patch SQL."
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.get("help")) {
    console.log(USAGE)
    return
  }

  const { url, anonKey, serviceRole } = resolveEnv()
  const admin = createReadOnlyClient(url, serviceRole)
  const anon = createReadOnlyClient(url, anonKey)

  const relationChecks = await Promise.all(
    REQUIRED_RELATIONS.map((relation) => checkRelation(admin, relation))
  )
  const checks = [
    ...relationChecks,
    await checkPublicView(anon),
    await checkPublicRpc(anon),
  ]
  const summary = summarize(checks)

  if (args.get("json")) {
    console.log(JSON.stringify(summary, null, args.get("pretty") ? 2 : 0))
  } else {
    printText(summary)
  }

  if (args.get("strict") && !summary.ready) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
