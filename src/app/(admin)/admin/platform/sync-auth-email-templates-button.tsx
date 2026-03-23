"use client"

import { useTransition } from "react"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import WandSparklesIcon from "lucide-react/dist/esm/icons/wand-sparkles"

import { syncSupabaseAuthEmailTemplatesAction } from "./actions"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export function SyncAuthEmailTemplatesButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      className="gap-2"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const toastId = toast.loading("Syncing auth email templates...")
          const result = await syncSupabaseAuthEmailTemplatesAction()
          if ("error" in result) {
            toast.error(result.error, { id: toastId })
            return
          }
          toast.success("Supabase auth email templates synced.", { id: toastId })
        })
      }}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" data-icon="inline-start" />
      ) : (
        <WandSparklesIcon data-icon="inline-start" />
      )}
      Sync auth emails
    </Button>
  )
}
