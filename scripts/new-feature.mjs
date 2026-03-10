#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const FEATURES_ROOT = path.join(ROOT, "src", "features")
const ACCEPTANCE_TESTS_ROOT = path.join(ROOT, "tests", "acceptance")
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function toPascalCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

function usage() {
  console.error("Usage: pnpm scaffold:feature <feature-name> [--force]")
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeFileIfMissing(filePath, content, force) {
  try {
    await fs.access(filePath)
    if (!force) {
      console.log(`skip  ${path.relative(ROOT, filePath)}`)
      return
    }
  } catch {
    // file missing; write below
  }

  await fs.writeFile(filePath, content, "utf8")
  console.log(`write ${path.relative(ROOT, filePath)}`)
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes("--force")
  const featureName = args.find((arg) => !arg.startsWith("-"))

  if (!featureName) {
    usage()
    process.exit(1)
  }

  if (!KEBAB_CASE.test(featureName)) {
    console.error(`Feature name must be kebab-case: '${featureName}'`)
    process.exit(1)
  }

  const featurePath = path.join(FEATURES_ROOT, featureName)
  const featurePascal = toPascalCase(featureName)

  await ensureDir(path.join(featurePath, "components"))
  await ensureDir(path.join(featurePath, "hooks"))
  await ensureDir(path.join(featurePath, "lib"))
  await ensureDir(path.join(featurePath, "server"))
  await ensureDir(ACCEPTANCE_TESTS_ROOT)

  await writeFileIfMissing(
    path.join(featurePath, "README.md"),
    `# ${featurePascal} Feature\n\n` +
      `## Ownership\n` +
      `- Domain logic: \`src/features/${featureName}/lib/**\`\n` +
      `- Server actions/queries: \`src/features/${featureName}/server/**\`\n` +
      `- UI components: \`src/features/${featureName}/components/**\`\n` +
      `- Hooks/controllers: \`src/features/${featureName}/hooks/**\`\n\n` +
      `## Rules\n` +
      `- Keep route files in \`src/app/**\` as composition-only wrappers over this feature.\n` +
      `- Import other features only through their public entrypoint (\`@/features/<name>\`).\n` +
      `- Keep \`lib/**\` pure: no React, no UI imports, no route imports.\n` +
      `- Keep \`server/**\` free of UI/component imports.\n` +
      `- Keep shared UI in \`src/components/ui/**\`; avoid one-off primitives here.\n` +
      `- Keep acceptance coverage in \`tests/acceptance/${featureName}.test.ts\`.\n` +
      `- Add acceptance tests for user-visible behavior before merging.\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "index.ts"),
    `export { ${featurePascal}Panel } from "./components"\n` +
      `export { normalize${featurePascal}Input } from "./lib"\n` +
      `export type { ${featurePascal}Input } from "./types"\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "types.ts"),
    `export type ${featurePascal}Input = {\n` +
      `  // Add feature input fields here.\n` +
      `  id: string\n` +
      `}\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "lib", "index.ts"),
    `import type { ${featurePascal}Input } from "../types"\n\n` +
      `export function normalize${featurePascal}Input(input: ${featurePascal}Input): ${featurePascal}Input {\n` +
      `  // Keep this layer pure and framework-agnostic.\n` +
      `  return input\n` +
      `}\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "components", "index.ts"),
    `export { ${featurePascal}Panel } from "./${featureName}-panel"\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "server", "actions.ts"),
    `"use server"\n\n` +
      `import { normalize${featurePascal}Input } from "../lib"\n` +
      `import type { ${featurePascal}Input } from "../types"\n\n` +
      `export async function save${featurePascal}(input: ${featurePascal}Input) {\n` +
      `  const normalized = normalize${featurePascal}Input(input)\n` +
      `  // Persist with DB layer here.\n` +
      `  return normalized\n` +
      `}\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "hooks", `use-${featureName}-controller.ts`),
    `import { useMemo } from "react"\n` +
      `import type { ${featurePascal}Input } from "../types"\n\n` +
      `export function use${featurePascal}Controller(input: ${featurePascal}Input) {\n` +
      `  return useMemo(() => ({ input }), [input])\n` +
      `}\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(featurePath, "components", `${featureName}-panel.tsx`),
    `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"\n` +
      `import type { ${featurePascal}Input } from "../types"\n\n` +
      `type ${featurePascal}PanelProps = {\n` +
      `  input: ${featurePascal}Input\n` +
      `}\n\n` +
      `export function ${featurePascal}Panel({ input }: ${featurePascal}PanelProps) {\n` +
      `  return (\n` +
      `    <Card>\n` +
      `      <CardHeader>\n` +
      `        <CardTitle>${featurePascal}</CardTitle>\n` +
      `      </CardHeader>\n` +
      `      <CardContent className=\"text-sm text-muted-foreground\">{input.id}</CardContent>\n` +
      `    </Card>\n` +
      `  )\n` +
      `}\n`,
    force,
  )

  await writeFileIfMissing(
    path.join(ACCEPTANCE_TESTS_ROOT, `${featureName}.test.ts`),
    `import { describe, expect, it } from "vitest"\n\n` +
      `describe("${featureName} feature contract", () => {\n` +
      `  it("has baseline acceptance coverage stub", () => {\n` +
      `    expect(true).toBe(true)\n` +
      `  })\n` +
      `})\n`,
    force,
  )

  console.log(`\nFeature scaffold ready: src/features/${featureName}`)
}

main().catch((error) => {
  console.error("Unable to scaffold feature", error)
  process.exit(1)
})
