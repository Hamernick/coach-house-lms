import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(join(process.cwd(), "package.json"))

export const VISUAL_BASELINE_ENVIRONMENT = Object.freeze({
  platform: "linux",
  arch: "x64",
  distribution: "ubuntu",
  distributionVersion: "24.04",
  playwrightVersion: "1.58.2",
})

function readOsReleaseField(contents: string, name: string) {
  const match = contents.match(new RegExp(`^${name}=(.*)$`, "m"))
  return match?.[1]?.trim().replace(/^(["'])(.*)\1$/, "$2") ?? null
}

export function readVisualBaselineEnvironment(): Record<string, string | null> {
  let osRelease = ""
  if (process.platform === "linux") {
    try {
      osRelease = readFileSync("/etc/os-release", "utf8")
    } catch {
      // The validator below reports the unsupported distribution.
    }
  }

  return {
    platform: process.platform,
    arch: process.arch,
    distribution: readOsReleaseField(osRelease, "ID"),
    distributionVersion: readOsReleaseField(osRelease, "VERSION_ID"),
    playwrightVersion: require("@playwright/test/package.json").version,
  }
}

export function assertVisualBaselineEnvironment(
  environment: Record<string, string | null> = readVisualBaselineEnvironment()
) {
  for (const [key, expected] of Object.entries(VISUAL_BASELINE_ENVIRONMENT)) {
    if (environment[key] !== expected) {
      throw new Error(
        "Visual comparisons and baseline updates require Ubuntu 24.04 x64 " +
          "with Playwright 1.58.2. Use the hosted visual job. " +
          "macOS browser captures are for UI review. " +
          `Found ${key}: ${environment[key] ?? "unknown"}.`
      )
    }
  }
}
