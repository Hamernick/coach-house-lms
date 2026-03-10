#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const ESLINT_CONFIG_PATH = path.join(ROOT, "eslint.config.mjs")
const STRUCTURE_SCRIPT_PATH = path.join(ROOT, "scripts", "check-structure-conventions.mjs")
const ROUTE_CONTRACT_SCRIPT_PATH = path.join(ROOT, "scripts", "check-route-entry-contract.mjs")
const BASELINE_PATH = path.join(ROOT, "docs", "agent", "quality-threshold-baseline.json")

function extractNumber(source, pattern, label) {
  const match = source.match(pattern)
  if (!match) {
    throw new Error(`Unable to locate ${label}`)
  }
  return Number.parseFloat(match[1])
}

function assertNoIncrease({ label, current, baseline, errors, lowered }) {
  if (current > baseline) {
    errors.push(`${label} increased: baseline ${baseline}, current ${current}`)
    return
  }
  if (current < baseline) {
    lowered.push(`${label} lowered: baseline ${baseline}, current ${current}`)
  }
}

async function main() {
  const [baselineRaw, eslintConfigRaw, structureScriptRaw, routeContractScriptRaw] = await Promise.all([
    fs.readFile(BASELINE_PATH, "utf8"),
    fs.readFile(ESLINT_CONFIG_PATH, "utf8"),
    fs.readFile(STRUCTURE_SCRIPT_PATH, "utf8"),
    fs.readFile(ROUTE_CONTRACT_SCRIPT_PATH, "utf8"),
  ])

  const baseline = JSON.parse(baselineRaw)

  const current = {
    eslint: {
      complexityMax: extractNumber(
        eslintConfigRaw,
        /complexity:\s*\["error",\s*\{\s*max:\s*(\d+)\s*\}\]/u,
        "eslint complexity max",
      ),
      maxLines: extractNumber(
        eslintConfigRaw,
        /"max-lines":\s*\["error",\s*\{\s*max:\s*(\d+)/u,
        "eslint max-lines",
      ),
      maxLinesPerFunction: extractNumber(
        eslintConfigRaw,
        /"max-lines-per-function":\s*\[\s*"error",\s*\{\s*max:\s*(\d+)/u,
        "eslint max-lines-per-function",
      ),
    },
    structure: {
      componentLineBudget: extractNumber(
        structureScriptRaw,
        /const COMPONENT_LINE_BUDGET = (\d+)/u,
        "component line budget",
      ),
      sourceLineBudget: extractNumber(
        structureScriptRaw,
        /const SOURCE_LINE_BUDGET = (\d+)/u,
        "source line budget",
      ),
      lineBudgetWarningThreshold: extractNumber(
        structureScriptRaw,
        /const LINE_BUDGET_WARNING_THRESHOLD = ([0-9.]+)/u,
        "line budget warning threshold",
      ),
    },
    routes: {
      pageLayoutBudget: extractNumber(
        routeContractScriptRaw,
        /const PAGE_LAYOUT_BUDGET = (\d+)/u,
        "route page/layout budget",
      ),
      pageLayoutWarningThreshold: extractNumber(
        routeContractScriptRaw,
        /const PAGE_LAYOUT_WARNING_THRESHOLD = ([0-9.]+)/u,
        "route page/layout warning threshold",
      ),
      pageLayoutAllowlistMax: extractNumber(
        routeContractScriptRaw,
        /const PAGE_LAYOUT_BUDGET_ALLOWLIST_MAX = (\d+)/u,
        "route page/layout allowlist max",
      ),
    },
  }

  const errors = []
  const lowered = []

  assertNoIncrease({
    label: "eslint.complexityMax",
    current: current.eslint.complexityMax,
    baseline: baseline.eslint.complexityMax,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "eslint.maxLines",
    current: current.eslint.maxLines,
    baseline: baseline.eslint.maxLines,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "eslint.maxLinesPerFunction",
    current: current.eslint.maxLinesPerFunction,
    baseline: baseline.eslint.maxLinesPerFunction,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "structure.componentLineBudget",
    current: current.structure.componentLineBudget,
    baseline: baseline.structure.componentLineBudget,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "structure.sourceLineBudget",
    current: current.structure.sourceLineBudget,
    baseline: baseline.structure.sourceLineBudget,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "structure.lineBudgetWarningThreshold",
    current: current.structure.lineBudgetWarningThreshold,
    baseline: baseline.structure.lineBudgetWarningThreshold,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "routes.pageLayoutBudget",
    current: current.routes.pageLayoutBudget,
    baseline: baseline.routes.pageLayoutBudget,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "routes.pageLayoutWarningThreshold",
    current: current.routes.pageLayoutWarningThreshold,
    baseline: baseline.routes.pageLayoutWarningThreshold,
    errors,
    lowered,
  })
  assertNoIncrease({
    label: "routes.pageLayoutAllowlistMax",
    current: current.routes.pageLayoutAllowlistMax,
    baseline: baseline.routes.pageLayoutAllowlistMax,
    errors,
    lowered,
  })

  if (errors.length > 0) {
    console.error("Threshold regression check failed:")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  if (lowered.length > 0) {
    console.log("Thresholds ratcheted downward:")
    for (const line of lowered) {
      console.log(`- ${line}`)
    }
  } else {
    console.log("Threshold regression check passed.")
  }
}

main().catch((error) => {
  console.error("Unable to run threshold regression check", error)
  process.exit(1)
})
