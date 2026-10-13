import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import { resolvePublicAuthCallbackHref } from "@/components/public/public-auth-callback"
import { PublicFindRoute } from "@/features/find-map"
import { PublicMapHomeLoading } from "@/components/public/public-map-index/map-loading-state"

export const metadata: Metadata = {
  title: "Home",
  alternates: { canonical: "/" },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries((await searchParams) ?? {})) {
    if (typeof value === "string") params.append(key, value)
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    }
  }
  const callbackHref = resolvePublicAuthCallbackHref({
    pathname: "/",
    searchParams: params,
  })
  if (callbackHref) redirect(callbackHref)

  return (
    <HomeCanvasFindShell inset={false} glassHeader>
      <main
        aria-label="Home"
        className="relative isolate min-h-0 w-full min-w-0 flex-1 scroll-pt-16 overflow-x-hidden overflow-y-auto p-3 pt-[76px] pb-[max(3rem,env(safe-area-inset-bottom))] [clip-path:inset(0)] sm:p-4 sm:pt-[88px] sm:pb-12 md:pt-[104px]"
      >
        <Suspense fallback={<PublicMapHomeLoading />}>
          <PublicFindRoute embedded searchParams={searchParams} />
        </Suspense>
      </main>
    </HomeCanvasFindShell>
  )
}
