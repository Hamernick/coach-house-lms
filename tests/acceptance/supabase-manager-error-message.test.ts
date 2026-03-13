import { describe, expect, it } from "vitest"

import { extractSupabaseManagerErrorMessage } from "@/components/supabase-manager/error-message"

describe("extractSupabaseManagerErrorMessage", () => {
  it("prefers the proxy response message when present", () => {
    expect(
      extractSupabaseManagerErrorMessage(
        {
          message: "Request failed with status code 500",
          response: {
            data: {
              message: "Server configuration error.",
            },
          },
        },
        "fallback"
      )
    ).toBe("Server configuration error.")
  })

  it("falls back cleanly when no structured error is present", () => {
    expect(extractSupabaseManagerErrorMessage(null, "fallback")).toBe("fallback")
  })
})
