"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_HINT_TIMEOUT_MS = 1800
export const WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE =
  "We'll go over this later :)"

export function WorkspaceBoardVaultTutorialInteractionShield() {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const clearOpenTimeout = useCallback(() => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const showHint = useCallback(() => {
    clearOpenTimeout()
    setOpen(true)
    timeoutRef.current = window.setTimeout(() => {
      setOpen(false)
      timeoutRef.current = null
    }, WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_HINT_TIMEOUT_MS)
  }, [clearOpenTimeout])

  const hideHint = useCallback(() => {
    clearOpenTimeout()
    setOpen(false)
  }, [clearOpenTimeout])

  useEffect(() => () => clearOpenTimeout(), [clearOpenTimeout])

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE}
          className="absolute inset-0 z-20 h-auto cursor-help rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            showHint()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            showHint()
          }}
          onFocus={showHint}
          onBlur={hideHint}
          onPointerEnter={showHint}
          onPointerLeave={hideHint}
        />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={12}
        className={`workspace-tutorial-callout w-52 whitespace-normal text-left ${WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME}`}
      >
        <p className="text-xs leading-tight">
          {WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
