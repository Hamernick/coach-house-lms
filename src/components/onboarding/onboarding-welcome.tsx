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
      "Upgrade when you’re ready to publish",
    ],
  },
  accelerator: {
    eyebrow: "Coach House Accelerator",
    title: "Welcome",
    description: "Take a quick tour — then start with the first module in Overview.",
    checklist: [
      "Start in Overview and work through modules in order",
      "Assignments automatically build your organization story",
      "Use Search to jump between lessons",
      "Replay this tour anytime from the account menu",
    ],
  },
}

export function OnboardingWelcome({
  defaultOpen = false,
  tutorial = "platform",
}: {
  defaultOpen?: boolean
  tutorial?: "platform" | "accelerator"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get("welcome") === "1"
  const resolvedTutorial: "platform" | "accelerator" = tutorial === "accelerator" ? "accelerator" : "platform"
  const content = WELCOME_CONTENT[resolvedTutorial]
  const [open, setOpen] = useState(isWelcome || defaultOpen)
  const [, startTransition] = useTransition()

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
      <DialogContent className="w-[min(560px,92%)] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-0 text-white shadow-2xl">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(560px_circle_at_center,white,transparent)]">
            <svg
              viewBox="0 0 560 560"
              width="560"
              height="560"
              className="absolute left-1/2 top-[-220px] -translate-x-1/2"
              aria-hidden
            >
              {[120, 180, 240, 300, 360].map((r) => (
                <circle key={r} cx="280" cy="280" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              ))}
            </svg>
          </div>

          <div className="space-y-0 px-8 pb-6 pt-10 text-center">
            <p className="text-xs font-semibold text-white/60">{content.eyebrow}</p>
            <DialogTitle asChild>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{content.title}</h2>
            </DialogTitle>
            <DialogDescription asChild>
              <p className="mt-2 text-sm text-white/70">{content.description}</p>
            </DialogDescription>
          </div>

          <div className="space-y-4 px-8 pb-8">
            <ul className="space-y-3 text-sm">
              {content.checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-left">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5">
                    <CheckIcon className="h-3 w-3 text-white" aria-hidden />
                  </span>
                  <span className="text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-black/30 px-8 py-5">
            <Button
              type="button"
              variant="ghost"
              className="text-white/70 hover:bg-white/10 hover:text-white"
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
              className="bg-white text-black hover:bg-white/90"
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
