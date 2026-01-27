"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import CheckIcon from "lucide-react/dist/esm/icons/check"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { dismissTutorialAction, type TutorialKey } from "@/app/actions/tutorial"

function dispatchTutorialStart(tutorial: TutorialKey) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("coachhouse:tutorial:start", { detail: { tutorial } }))
}

const PLATFORM_UPGRADE_CHECKLIST_ITEM = "Upgrade when you’re ready to publish"

const WELCOME_CONTENT: Record<
  "platform" | "accelerator",
  { eyebrow: string; title: string; description: string; checklist: string[] }
> = {
  platform: {
    eyebrow: "Coach House",
    title: "Welcome",
    description: "You’re all set. Take a quick tour — it takes about a minute.",
    checklist: [
      "Complete your organization profile",
      "Build your roadmap (private by default)",
      "Use Search to jump between tools",
      PLATFORM_UPGRADE_CHECKLIST_ITEM,
    ],
  },
  accelerator: {
    eyebrow: "Coach House Accelerator",
    title: "Welcome",
    description: "Take a quick tour — then start with the first module in Overview.",
    checklist: [
      "Start in Overview and work through modules in order",
      "Assignments automatically build your organization story",
      "Use Search to find information in your account quickly.",
      "Use Return home to get back to your organization.",
      "Replay this tour anytime from the account menu",
    ],
  },
}

export function OnboardingWelcome({
  defaultOpen = false,
  tutorial = "platform",
  hasActiveSubscription,
}: {
  defaultOpen?: boolean
  tutorial?: "platform" | "accelerator"
  hasActiveSubscription?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get("welcome") === "1"
  const resolvedTutorial: "platform" | "accelerator" = tutorial === "accelerator" ? "accelerator" : "platform"
  const content = WELCOME_CONTENT[resolvedTutorial]
  const [open, setOpen] = useState(isWelcome || defaultOpen)
  const [, startTransition] = useTransition()

  const checklist = useMemo(() => {
    if (resolvedTutorial !== "platform") return content.checklist
    if (!hasActiveSubscription) return content.checklist
    return content.checklist.filter((item) => item !== PLATFORM_UPGRADE_CHECKLIST_ITEM)
  }, [content.checklist, hasActiveSubscription, resolvedTutorial])

  useEffect(() => {
    setOpen(isWelcome || defaultOpen)
  }, [defaultOpen, isWelcome])

  const closeHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("welcome")
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }, [pathname, searchParams])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
      <DialogContent className="w-[min(560px,92%)] overflow-hidden rounded-3xl border border-border/60 bg-background/95 p-0 text-foreground shadow-2xl supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-35 [mask-image:radial-gradient(560px_circle_at_center,white,transparent)] dark:opacity-70">
            <svg
              viewBox="0 0 560 560"
              width="560"
              height="560"
              className="absolute left-1/2 top-[-220px] -translate-x-1/2 text-foreground/10"
              aria-hidden
            >
              {[120, 180, 240, 300, 360].map((r) => (
                <circle key={r} cx="280" cy="280" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
              ))}
            </svg>
          </div>

          <div className="space-y-0 px-8 pb-6 pt-10 text-center">
            <p className="text-xs font-semibold text-muted-foreground">{content.eyebrow}</p>
            <DialogTitle asChild>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{content.title}</h2>
            </DialogTitle>
            <DialogDescription asChild>
              <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
            </DialogDescription>
          </div>

          <div className="space-y-4 px-8 pb-8">
            <ul className="space-y-3 text-sm">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-left">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-border/60 bg-muted/50">
                    <CheckIcon className="h-3 w-3 text-foreground" aria-hidden />
                  </span>
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/30 px-8 py-5">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                router.replace(closeHref)
                router.refresh()
                setOpen(false)
                startTransition(async () => {
                  await dismissTutorialAction(resolvedTutorial)
                })
              }}
            >
              Skip
            </Button>
            <Button
              type="button"
              onClick={() => {
                router.replace(closeHref)
                router.refresh()
                setOpen(false)
                dispatchTutorialStart(resolvedTutorial)
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
