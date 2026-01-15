import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

function getSafeRedirect(path?: string | null) {
  if (!path) return null
  if (!path.startsWith("/")) return null
  if (path.startsWith("//")) return null
  return path
}

export async function handleSupabaseAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const redirectParam = getSafeRedirect(requestUrl.searchParams.get("redirect"))

  const fallback = type === "recovery" ? "/update-password" : "/my-organization"
  const destination = new URL(redirectParam ?? fallback, requestUrl.origin)

  if (!code) {
    const errorUrl = new URL("/login", requestUrl.origin)
    errorUrl.searchParams.set("error", "Missing verification code")
    return NextResponse.redirect(errorUrl)
  }

  const response = NextResponse.redirect(destination)
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const errorUrl = new URL("/login", requestUrl.origin)
    errorUrl.searchParams.set("error", error.message)
    return NextResponse.redirect(errorUrl)
  }

  return response
}

