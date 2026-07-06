#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const PATCH_MIGRATION_PATHS = [
  "supabase/migrations/20260626214500_resource_map_public_read_contract_patch.sql",
  "supabase/migrations/20260628131000_resource_map_availability_contract.sql",
]

function extractPublicReadContractSql() {
  return PATCH_MIGRATION_PATHS.map((path) =>
    readFileSync(resolve(process.cwd(), path), "utf8").trimEnd()
  ).join("\n\n")
}

function main() {
  process.stdout.write(extractPublicReadContractSql())
}

main()
