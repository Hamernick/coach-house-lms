import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

const PROTECTED_PREFIXES = [
  "/class",
  "/academy",
  "/classes",
  "/organizations",
  "/billing",
  "/admin",
  "/internal",
  "/onboarding",
]
const AUTH_ROUTES = new Set(["/login", "/sign-up", "/forgot-password"])

export async function proxy(request: NextRequest) {
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
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.has(pathname)

  if (!user && isProtected) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  if (user && isAuthRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/organization", request.url))
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  // Onboarding is now an in-app overlay; do not redirect to /onboarding here.

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
