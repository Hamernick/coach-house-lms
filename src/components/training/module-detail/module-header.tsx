"use client"

import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Pencil from "lucide-react/dist/esm/icons/pencil"
import { Button } from "@/components/ui/button"
import { HeaderTitlePortal } from "@/components/header-title-portal"

interface ModuleHeaderProps {
  title: string
  subtitle?: string
  isAdmin: boolean
  wizardError: string | null
  wizardLoading: boolean
  onEdit: () => void
  titlePlacement?: "header" | "body"
}

export function ModuleHeader({
  title,
  subtitle,
  isAdmin,
  wizardError,
  wizardLoading,
  onEdit,
  titlePlacement = "body",
}: ModuleHeaderProps) {
  const titleBlock = (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-semibold text-foreground truncate">{title}</p>
      {subtitle ? (
        <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
      ) : null}
    </div>
  )

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      {titlePlacement === "header" ? <HeaderTitlePortal>{titleBlock}</HeaderTitlePortal> : null}
      <div className="min-w-0 space-y-3">
        {titlePlacement === "body" ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle ? <p className="max-w-3xl text-base text-muted-foreground">{subtitle}</p> : null}
          </>
        ) : null}
      </div>
      {isAdmin ? (
        <div className="flex flex-col items-end gap-2">
          {wizardError ? <p className="text-xs text-rose-500">{wizardError}</p> : null}
          <Button
            size="sm"
            variant="outline"
            className="min-h-9 gap-2 shrink-0"
            onClick={onEdit}
            disabled={wizardLoading}
          >
            {wizardLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Pencil className="h-4 w-4" aria-hidden />
            )}
            <span>{wizardLoading ? "Loading…" : "Edit module"}</span>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
