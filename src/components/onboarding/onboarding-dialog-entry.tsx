"use client"

import { useEffect, useState, type ComponentType } from "react"

import type { OnboardingDialogProps } from "./onboarding-dialog"

type DialogComponent = ComponentType<OnboardingDialogProps>

export function OnboardingDialogEntry(props: OnboardingDialogProps) {
  const { open } = props
  const [Dialog, setDialog] = useState<DialogComponent | null>(null)

  useEffect(() => {
    if (!open || Dialog) {
      return
    }

    let mounted = true

    import("./onboarding-dialog")
      .then((mod) => {
        if (mounted) {
          setDialog(() => mod.OnboardingDialog)
        }
      })
      .catch(() => {
        // Swallow the error; dialog simply won't appear.
      })

    return () => {
      mounted = false
    }
  }, [open, Dialog])

  if (!open || !Dialog) {
    return null
  }

  return <Dialog {...props} />
}
