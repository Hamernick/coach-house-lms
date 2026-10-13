"use client"

import { useRouter } from "next/navigation"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { HomeCanvasLoginButton } from "@/components/public/home-canvas-login-button"
import { PublicMapFooter } from "@/components/public/public-map-index/footer"
import { BuildCollectPublicHeader } from "./build-collect-public-header"

export function PublicHomeLanding() {
  const router = useRouter()

  return (
    <div data-public-home-landing="" className="flex min-h-svh flex-col bg-muted text-foreground dark:bg-background">
      <BuildCollectPublicHeader
        activeArea="collect"
        showPublicSearch={false}
        authAction={<HomeCanvasLoginButton activeSection="find" changeSection={(section) => router.push(`/home-canvas?section=${section}`)} />}
        themeAction={<PublicThemeToggle variant="outline" size="icon" className="relative size-8 shrink-0 touch-manipulation shadow-none after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-1/2" />}
      />
      <main aria-label="Home" className="mx-4 min-h-40 flex-1 rounded-[28px] border border-border bg-background sm:mx-5" />
      <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <PublicMapFooter showClaim={false} />
      </div>
    </div>
  )
}
