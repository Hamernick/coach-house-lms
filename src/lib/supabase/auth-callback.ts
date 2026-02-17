import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

function getSafeRedirect(path?: string | null) {
  if (!path) return null
  if (!path.startsWith("/")) return null
  if (path.startsWith("//")) return null
  return path
}

function getSafeType(type?: string | null): EmailOtpType | null {
  if (!type) return null
  const normalized = type.toLowerCase()
  switch (normalized) {
    case "signup":
    case "invite":
    case "magiclink":
    case "recovery":
    case "email_change":
    case "email":
      return normalized
    default:
      return null
  }
}

function isPkceVerifierMissingError(message?: string | null) {
  if (!message) return false
  const normalized = message.toLowerCase()
  return (
    normalized.includes("pkce code verifier") ||
    normalized.includes("code verifier not found in storage")
  )
}

function toLoginUrl(
  requestUrl: URL,
  options: {
    redirect?: string | null
    error?: string | null
    notice?: string | null
  } = {},
) {
  const loginUrl = new URL("/", requestUrl.origin)
  loginUrl.searchParams.set("section", "login")
  if (options.redirect) {
    loginUrl.searchParams.set("redirect", options.redirect)
  }
  if (options.error) {
    loginUrl.searchParams.set("error", options.error)
  }
  if (options.notice) {
    loginUrl.searchParams.set("notice", options.notice)
  }
  return loginUrl
}

export async function handleSupabaseAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = getSafeType(requestUrl.searchParams.get("type"))
  const redirectParam = getSafeRedirect(requestUrl.searchParams.get("redirect"))

  const fallback = type === "recovery" ? "/update-password" : "/organization"
  const destination = new URL(redirectParam ?? fallback, requestUrl.origin)
  const response = NextResponse.redirect(destination)
  const supabase = createSupabaseRouteHandlerClient(request, response)

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return response
    }

    const message =
      type === "signup"
        ? "This confirmation link is invalid or expired. Request a new confirmation email."
        : "This auth link is invalid or expired. Request a new link and try again."
    return NextResponse.redirect(
      toLoginUrl(requestUrl, {
        redirect: redirectParam,
        error: message,
      }),
    )
  }

  if (!code) {
    return NextResponse.redirect(
      toLoginUrl(requestUrl, {
        redirect: redirectParam,
        error: "Missing verification code. Request a new confirmation link.",
      }),
    )
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    if (type === "signup" && isPkceVerifierMissingError(error.message)) {
      return NextResponse.redirect(
        toLoginUrl(requestUrl, {
          redirect: redirectParam,
          notice: "email_confirmed_sign_in",
        }),
      )
    }

    const fallbackError = "We couldn't complete sign-in from that link. Please sign in manually."
    return NextResponse.redirect(
      toLoginUrl(requestUrl, {
        redirect: redirectParam,
        error: error.message || fallbackError,
      }),
    )
  }

  return response
}
