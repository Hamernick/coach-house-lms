import { defineConfig } from "@playwright/test"

const PRODUCTION_SUPABASE_HOST = "vswzhuwjtgzrkxknrmxu.supabase.co"

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

const qaUrl = requireEnvironment("FISCAL_AUTH_QA_SUPABASE_URL")
const qaAnonKey = requireEnvironment("FISCAL_AUTH_QA_ANON_KEY")
const qaServiceRoleKey = requireEnvironment("FISCAL_AUTH_QA_SERVICE_ROLE_KEY")
const qaPostgresUrl = requireEnvironment("FISCAL_AUTH_QA_POSTGRES_URL")
const qaPostgresDirectUrl = requireEnvironment(
  "FISCAL_AUTH_QA_POSTGRES_URL_NON_POOLING"
)

if (process.env.FISCAL_AUTH_QA_ALLOW_SEED !== "preview-branch") {
  throw new Error(
    "FISCAL_AUTH_QA_ALLOW_SEED=preview-branch is required for destructive QA fixtures."
  )
}
if (new URL(qaUrl).hostname === PRODUCTION_SUPABASE_HOST) {
  throw new Error("Fiscal auth route tests cannot target production Supabase.")
}

const port = process.env.FISCAL_AUTH_QA_PORT ?? "3108"
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "fiscal-sponsorship-authenticated-routes.visual.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 180_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    baseURL,
    colorScheme: "light",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    env: {
      ENABLE_STRIPE_ENTITLEMENT_SYNC: "0",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: qaAnonKey,
      NEXT_PUBLIC_SUPABASE_URL: qaUrl,
      NEXT_TELEMETRY_DISABLED: "1",
      POSTGRES_URL: qaPostgresUrl,
      POSTGRES_URL_NON_POOLING: qaPostgresDirectUrl,
      SUPABASE_SERVICE_ROLE_KEY: qaServiceRoleKey,
      SUPABASE_URL: qaUrl,
    },
    reuseExistingServer: false,
    timeout: 240_000,
    url: `${baseURL}/team/login`,
  },
})
