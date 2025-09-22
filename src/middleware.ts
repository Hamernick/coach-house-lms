import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/dashboard", "/class", "/classes", "/schedule", "/settings", "/billing", "/admin"]
const AUTH_ROUTES = new Set(["/login", "/sign-up", "/forgot-password"])

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value
  const refreshToken = request.cookies.get("sb-refresh-token")?.value
  const hasSession = Boolean(accessToken && refreshToken)

  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.has(pathname)

  if (!hasSession && isProtected) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search)
    return NextResponse.redirect(redirectUrl)
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|api/auth).*)"],
}
