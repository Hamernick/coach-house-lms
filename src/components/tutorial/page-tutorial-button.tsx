"use client"

import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"

import { HeaderActionsPortal } from "@/components/header-actions-portal"
import { Button } from "@/components/ui/button"
import type { TutorialKey } from "@/app/actions/tutorial"

export function PageTutorialButton({
  tutorial,
  label = "Tutorial",
}: {
  tutorial: TutorialKey
  label?: string
}) {
  return (
    <HeaderActionsPortal slot="right">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="gap-2"
        onClick={() => {
          if (typeof window === "undefined") return
          window.dispatchEvent(new CustomEvent("coachhouse:tutorial:start", { detail: { tutorial } }))
        }}
      >
        <BookOpenIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    </HeaderActionsPortal>
  )
}
