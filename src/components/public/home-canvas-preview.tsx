"use client"

import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down"
import CircleDollarSign from "lucide-react/dist/esm/icons/circle-dollar-sign"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import LogIn from "lucide-react/dist/esm/icons/log-in"
import UserPlus from "lucide-react/dist/esm/icons/user-plus"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
} from "react"

import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { LoginPanel } from "@/components/auth/login-panel"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { CaseStudyAutofillFab } from "@/components/dev/case-study-autofill-fab"
import {
  HOME2_SECTION_NAV,
  Home2HeroSection,
  Home2ImpactSection,
  Home2OfferingsSection,
  Home2ProcessSection,
  Home2TeamSection,
  type Home2SectionId,
} from "@/components/public/home2-sections"
import { resolveCanvasSectionBehavior } from "@/components/public/home-canvas-behavior"
import { resolveSwipeSectionDelta, resolveWheelSectionDelta } from "@/components/public/home-canvas-scroll"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type CanvasSectionId = Home2SectionId | "pricing" | "login" | "signup"

type CanvasNavItem = {
  id: CanvasSectionId
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  kind: "home"
}

const CANVAS_LABEL_OVERRIDES: Partial<Record<Home2SectionId, string>> = {
  hero: "Welcome",
  impact: "Why Us",
  offerings: "Platform",
  process: "Journey",
}

const HIDDEN_HOME_SECTIONS = new Set<Home2SectionId>(["process", "news", "team", "cta"])

const CANVAS_NAV: CanvasNavItem[] = [
  ...HOME2_SECTION_NAV.filter((item) => !HIDDEN_HOME_SECTIONS.has(item.id)).map((item) => ({
    ...item,
    label: CANVAS_LABEL_OVERRIDES[item.id] ?? item.label,
    kind: "home" as const,
  })),
  { id: "pricing", label: "Pricing", icon: CircleDollarSign, kind: "home" },
  { id: "login", label: "Sign in", icon: LogIn, kind: "home" },
  { id: "signup", label: "Sign up", icon: UserPlus, kind: "home" },
]

const HIDDEN_CANVAS_SECTION_IDS = new Set<CanvasSectionId>(["login", "signup"])
const VISIBLE_CANVAS_NAV = CANVAS_NAV.filter((item) => !HIDDEN_CANVAS_SECTION_IDS.has(item.id))

const HOME_SECTION_IDS = new Set<Home2SectionId>(HOME2_SECTION_NAV.map((item) => item.id))
const ABOUT_LINK_HREF = "https://www.coachhousesolutions.org/"
const WHEEL_INTENT_THRESHOLD = 90
const WHEEL_INTENT_RESET_MS = 180
const SECTION_WHEEL_LOCK_MS = 750
const OPEN_DIALOG_SELECTOR = "[data-slot='dialog-content'][data-state='open']"

function isHomeSectionId(sectionId: CanvasSectionId): sectionId is Home2SectionId {
  return HOME_SECTION_IDS.has(sectionId as Home2SectionId)
}

function hasOpenDialog(): boolean {
  if (typeof document === "undefined") return false
  return Boolean(document.querySelector(OPEN_DIALOG_SELECTOR))
}

function parseInitialSection(raw?: string): CanvasSectionId {
  const match = CANVAS_NAV.find((item) => item.id === raw)
  return match?.id ?? "hero"
}

type HomeCanvasPreviewProps = {
  initialSection?: string
  pricingPanel?: ReactNode
}

function CanvasAuthPanel({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login"
  const heading = "Create account"
  const description = "Join Coach House and start building your organization workspace."

  return (
    <div className="mx-auto grid min-h-full w-full max-w-[1100px] place-items-center px-4 py-6 md:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6">
        {isLogin ? (
          <LoginPanel
            redirectTo="/my-organization"
            className="max-w-none space-y-5"
            signUpHref="/home-canvas?section=signup"
          />
        ) : (
          <>
            <div className="mb-5 space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <SignUpForm
              redirectTo="/my-organization"
              loginHref="/home-canvas?section=login"
            />
          </>
        )}
      </div>
    </div>
  )
}

function HomeSectionPanel({ sectionId }: { sectionId: Home2SectionId }) {
  if (sectionId === "hero") {
    return (
      <div className="mx-auto grid min-h-full w-full max-w-[1100px] place-items-center px-4 py-6 md:px-6 lg:px-8">
        <Home2HeroSection />
      </div>
    )
  }

  if (sectionId === "impact") {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[1100px] items-center px-4 py-6 md:px-6 lg:px-8">
        <Home2ImpactSection staticText />
      </div>
    )
  }

  if (sectionId === "offerings") {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[1100px] items-center px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full justify-center">
          <Home2OfferingsSection layout="stacked" />
        </div>
      </div>
    )
  }

  if (sectionId === "process") {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[1100px] items-center px-4 py-6 md:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_1.1fr]">
          <Home2ProcessSection />
        </div>
      </div>
    )
  }

  if (sectionId === "team") {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[1100px] items-center px-4 py-6 md:px-6 lg:px-8">
        <div className="w-full">
          <Home2TeamSection withinCanvas />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto grid min-h-full w-full max-w-[1100px] place-items-center px-4 py-6 md:px-6 lg:px-8">
      <Home2HeroSection />
    </div>
  )
}

export function HomeCanvasPreview({ initialSection, pricingPanel }: HomeCanvasPreviewProps) {
  const resolvedInitialSection = parseInitialSection(initialSection)
  const [activeSection, setActiveSection] = useState<CanvasSectionId>(() => resolvedInitialSection)
  const [direction, setDirection] = useState<1 | -1>(1)
  const animationTimerRef = useRef<number | null>(null)
  const panelRefs = useRef<Partial<Record<CanvasSectionId, HTMLDivElement | null>>>({})
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeSectionRef = useRef<CanvasSectionId>(resolvedInitialSection)
  const isAnimatingRef = useRef(false)
  const wheelIntentRef = useRef<{ direction: -1 | 1 | null; total: number; lastTs: number }>({
    direction: null,
    total: 0,
    lastTs: 0,
  })
  const sectionWheelLockUntilRef = useRef(0)

  const activeLabel = useMemo(
    () => CANVAS_NAV.find((item) => item.id === activeSection)?.label ?? "Welcome",
    [activeSection],
  )
  const activeSectionBehavior = useMemo(() => resolveCanvasSectionBehavior(activeSection), [activeSection])

  const scheduleAnimationEnd = useCallback(() => {
    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current)
    }
    animationTimerRef.current = window.setTimeout(() => {
      isAnimatingRef.current = false
      animationTimerRef.current = null
    }, 380)
  }, [])

  const changeSection = useCallback(
    (nextSection: CanvasSectionId) => {
      const currentSection = activeSectionRef.current
      if (nextSection === currentSection) return

      const currentIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === currentSection)
      const nextIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === nextSection)
      if (currentIndex >= 0 && nextIndex >= 0) {
        setDirection(nextIndex > currentIndex ? 1 : -1)
      }

      activeSectionRef.current = nextSection
      setActiveSection(nextSection)
      isAnimatingRef.current = true
      wheelIntentRef.current = { direction: null, total: 0, lastTs: 0 }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now()
      sectionWheelLockUntilRef.current = now + SECTION_WHEEL_LOCK_MS
      scheduleAnimationEnd()

      if (typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href)
        nextUrl.pathname = nextUrl.pathname === "/home-canvas" ? "/" : nextUrl.pathname
        nextUrl.searchParams.set("section", nextSection)
        window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`)
      }
    },
    [scheduleAnimationEnd],
  )

  const goToAdjacentSection = useCallback(
    (delta: -1 | 1) => {
      const currentIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === activeSectionRef.current)
      if (currentIndex < 0) return

      const targetIndex = currentIndex + delta
      if (targetIndex < 0 || targetIndex >= VISIBLE_CANVAS_NAV.length) return
      changeSection(VISIBLE_CANVAS_NAV[targetIndex].id)
    },
    [changeSection],
  )

  useEffect(() => {
    const next = parseInitialSection(initialSection)
    const currentIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === activeSectionRef.current)
    const nextIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === next)
    if (currentIndex < 0 || activeSectionRef.current === next) return

    if (nextIndex >= 0) {
      setDirection(nextIndex > currentIndex ? 1 : -1)
    }
    activeSectionRef.current = next
    setActiveSection(next)
  }, [initialSection])

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current)
      }
    }
  }, [])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (hasOpenDialog()) {
        event.preventDefault()
        return
      }

      const activePanel = panelRefs.current[activeSection]
      const panelMetrics = activePanel
        ? {
            scrollTop: activePanel.scrollTop,
            scrollHeight: activePanel.scrollHeight,
            clientHeight: activePanel.clientHeight,
          }
        : null
      const delta = resolveWheelSectionDelta({
        deltaY: event.deltaY,
        isAnimating: isAnimatingRef.current,
        panel: panelMetrics,
      })
      if (!delta) return

      const now = typeof performance !== "undefined" ? performance.now() : Date.now()
      if (now < sectionWheelLockUntilRef.current) {
        event.preventDefault()
        return
      }

      const wheelIntent = wheelIntentRef.current
      const wheelDirection: -1 | 1 = event.deltaY >= 0 ? 1 : -1
      const isStaleGesture = now - wheelIntent.lastTs > WHEEL_INTENT_RESET_MS
      if (isStaleGesture || wheelIntent.direction !== wheelDirection) {
        wheelIntent.direction = wheelDirection
        wheelIntent.total = 0
      }
      wheelIntent.total += Math.abs(event.deltaY)
      wheelIntent.lastTs = now
      if (wheelIntent.total < WHEEL_INTENT_THRESHOLD) {
        event.preventDefault()
        return
      }

      // Reset intent once we commit to a section change so momentum doesn't skip sections.
      wheelIntentRef.current = { direction: null, total: 0, lastTs: 0 }
      event.preventDefault()
      goToAdjacentSection(delta)
    },
    [activeSection, goToAdjacentSection],
  )

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (hasOpenDialog()) return
    const touch = event.touches[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (hasOpenDialog()) return
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start) return

      const touch = event.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y

      const activePanel = panelRefs.current[activeSection]
      const delta = resolveSwipeSectionDelta({
        deltaX,
        deltaY,
        isAnimating: isAnimatingRef.current,
        panel: activePanel
          ? {
              scrollTop: activePanel.scrollTop,
              scrollHeight: activePanel.scrollHeight,
              clientHeight: activePanel.clientHeight,
            }
          : null,
      })
      if (!delta) return
      goToAdjacentSection(delta)
    },
    [activeSection, goToAdjacentSection],
  )

  return (
    <SidebarProvider
      defaultOpen
      data-shell-root
      className={cn(
        "h-svh min-h-0 overflow-hidden text-foreground bg-[var(--shell-bg)]",
        "[--shell-bg:var(--background)] [--shell-rail:var(--background)] [--shell-border:var(--border)]",
        "[--sidebar:var(--background)] [--sidebar-foreground:var(--foreground)] [--sidebar-border:var(--border)]",
        "[--shell-content-pad:1rem] sm:[--shell-content-pad:1.25rem] [--shell-rail-padding:0.75rem] [--shell-rail-item-padding:0.5rem] [--shell-rail-gap:1rem]",
      )}
    >
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsible="icon" variant="sidebar" className="border-0 bg-[var(--shell-rail)]">
          <SidebarHeader>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-sidebar-accent"
              aria-label="Coach House home"
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <Image
                  src="/coach-house-logo-light.png"
                  alt="Coach House logo"
                  width={32}
                  height={32}
                  className="block dark:hidden"
                  priority
                />
                <Image
                  src="/coach-house-logo-dark.png"
                  alt="Coach House logo"
                  width={32}
                  height={32}
                  className="hidden dark:block"
                  priority
                />
              </span>
              <span className="truncate text-sm font-semibold leading-none tracking-tight group-data-[collapsible=icon]:hidden">
                Coach House
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="pt-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {VISIBLE_CANVAS_NAV.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={activeSection === item.id}
                        tooltip={item.label}
                        aria-current={activeSection === item.id ? "page" : undefined}
                        onClick={() => changeSection(item.id)}
                      >
                        <item.icon className="h-4 w-4" aria-hidden />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="mt-2 pt-3">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      type="button"
                      isActive={activeSection === "signup"}
                      tooltip="Sign up"
                      className="bg-white !text-black shadow-sm hover:bg-white/90 hover:!text-black data-[active=true]:bg-white data-[active=true]:!text-black"
                      onClick={() => changeSection("signup")}
                    >
                      <UserPlus className="h-4 w-4 !text-black" aria-hidden />
                      <span>Sign up</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="pt-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href={ABOUT_LINK_HREF} target="_blank" rel="noreferrer noopener">
                        <ExternalLink className="h-4 w-4" aria-hidden />
                        <span>About</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="h-full min-h-0 overflow-hidden bg-[var(--shell-bg)]">
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 px-[var(--shell-content-pad)] py-2 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger
                className="size-8 rounded-md border border-[color:var(--shell-border)] text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                aria-label="Toggle sidebar"
              />
              <Separator orientation="vertical" className="h-4 bg-border" />
              <div id="site-header-title" className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{activeLabel}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant={activeSection === "login" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => changeSection("login")}
              >
                Sign in
              </Button>
              <PublicThemeToggle variant="outline" size="icon" />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 p-[var(--shell-content-pad)] md:pb-[var(--shell-content-pad)] md:pr-[var(--shell-content-pad)] md:pl-0 md:pt-0">
            <div className="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-[28px] border border-[color:var(--shell-border)] bg-[var(--shell-bg)]">
              <AnimatePresence custom={direction} initial={false} mode="wait">
                <motion.div
                  key={activeSection}
                  custom={direction}
                  initial={{ opacity: 0, y: direction > 0 ? 56 : -56 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: direction > 0 ? -56 : 56 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "absolute inset-0 overscroll-contain",
                    activeSectionBehavior.scrollable ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
                  )}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "PageDown") {
                      event.preventDefault()
                      goToAdjacentSection(1)
                    }
                    if (event.key === "ArrowUp" || event.key === "PageUp") {
                      event.preventDefault()
                      goToAdjacentSection(-1)
                    }
                  }}
                  tabIndex={0}
                  style={{ touchAction: activeSectionBehavior.touchAction }}
                  ref={(node) => {
                    panelRefs.current[activeSection] = node
                  }}
                >
                  {activeSection === "login" ? (
                    <CanvasAuthPanel mode="login" />
                  ) : activeSection === "signup" ? (
                    <CanvasAuthPanel mode="signup" />
                  ) : activeSection === "pricing" ? (
                    pricingPanel ?? (
                      <div className="mx-auto flex min-h-full w-full max-w-[960px] items-center justify-center px-4 py-6 md:px-6 lg:px-8">
                        <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Pricing is currently unavailable in this preview.
                          </p>
                          <Button asChild className="mt-4 rounded-xl">
                            <Link href="/pricing">Open pricing</Link>
                          </Button>
                        </div>
                      </div>
                    )
                  ) : isHomeSectionId(activeSection) ? (
                    <HomeSectionPanel sectionId={activeSection} />
                  ) : (
                    <HomeSectionPanel sectionId="hero" />
                  )}
                </motion.div>
              </AnimatePresence>
              <div
                className="pointer-events-none absolute right-4 bottom-4 z-20"
                aria-hidden
              >
                <div className="bg-background/95 text-foreground border-border/80 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
                  <ArrowDownIcon className="text-muted-foreground h-3.5 w-3.5 animate-bounce" />
                  <span className="text-muted-foreground">Scroll down</span>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      <CaseStudyAutofillFab allowToken />
    </SidebarProvider>
  )
}
