import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("stripe runtime production safety", () => {
  it("keeps production paid-plan checkout on the primary Stripe runtime", () => {
    const stripeRuntime = readSource("src/lib/billing/stripe-runtime.ts")

    expect(stripeRuntime).toContain('process.env.NODE_ENV !== "production" && isTester && tester')
    expect(stripeRuntime).not.toContain("if (isTester && tester) return tester")
    expect(stripeRuntime).toContain("resolveStripeRuntimeConfigForCoaching")
    expect(stripeRuntime).toContain("if ((isTester || shouldPreferTesterForLocalCoaching")
  })
})
