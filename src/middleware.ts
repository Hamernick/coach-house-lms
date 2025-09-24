import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/class",
  "/classes",
  "/schedule",
  "/settings",
  "/billing",
  "/admin",
  "/onboarding",
]
const AUTH_ROUTES = new Set(["/login", "/sign-up", "/forgot-password"])

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const hasSession = Boolean(session)

  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isOnboardingRoute = pathname.startsWith("/onboarding")
  const isAuthRoute = AUTH_ROUTES.has(pathname)

  if (!hasSession && isProtected) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  if (hasSession && isAuthRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url))
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  // If logged in but onboarding not completed, gate protected routes behind onboarding (allow the onboarding route itself)
  if (hasSession && isProtected && !isOnboardingRoute) {
    const meta = session!.user.user_metadata as Record<string, unknown> | null
    const completed = Boolean(meta?.onboarding_completed)
    if (!completed) {
      const redirectResponse = NextResponse.redirect(new URL("/onboarding", request.url))
      copyCookies(response, redirectResponse)
      return redirectResponse
    }
  }

  return response
}

function copyCookies(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    destination.cookies.set(cookie)
  })
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|api/auth).*)"],
}
