#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const PATCH_MIGRATIONS = [
  [
    "resource-map public read contract",
    "supabase/migrations/20260626214500_resource_map_public_read_contract_patch.sql",
  ],
  [
    "platform organization curation audit",
    "supabase/migrations/20260626224000_add_public_map_organization_curation_events.sql",
  ],
  [
    "resource-map availability contract",
    "supabase/migrations/20260628131000_resource_map_availability_contract.sql",
  ],
  [
    "resource-map public taxonomy categories",
    "supabase/migrations/20260628150000_resource_map_taxonomy_categories.sql",
  ],
  [
    "resource-map local data engine raw store",
    "supabase/migrations/20260628162000_resource_map_data_engine_contract.sql",
  ],
]

function readPatch([label, path]) {
  return [
    `-- Resource map schema setup patch: ${label}`,
    `-- Source: ${path}`,
    readFileSync(resolve(process.cwd(), path), "utf8").trimEnd(),
    "",
  ].join("\n")
}

function main() {
  process.stdout.write(PATCH_MIGRATIONS.map(readPatch).join("\n"))
}

main()
