"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import CircleCheckIcon from "lucide-react/dist/esm/icons/circle-check"
import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"

import { Button } from "@/components/ui/button"
import { useSupabaseClient } from "@/hooks/use-supabase-client"

import { GoogleAuthPanel } from "./google-auth-panel"

type GoogleConnectionStatus = "error" | "linked" | "loading" | "unlinked"

export function GoogleAccountConnection({
  email,
  viewport,
}: {
  email: string
  viewport: "desktop" | "mobile"
}) {
  const supabase = useSupabaseClient()
  const [isActiveViewport, setIsActiveViewport] = useState(false)
  const [status, setStatus] = useState<GoogleConnectionStatus>("loading")
  const isConfigured =
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  const titleId = `google-account-connection-${viewport}-title`

  useEffect(() => {
    const query = window.matchMedia(
      viewport === "mobile" ? "(max-width: 767px)" : "(min-width: 768px)"
    )
    const updateViewport = () => setIsActiveViewport(query.matches)
    updateViewport()
    query.addEventListener("change", updateViewport)
    return () => query.removeEventListener("change", updateViewport)
  }, [viewport])

  const loadConnectionStatus = useCallback(async () => {
    if (!isConfigured || !isActiveViewport) return

    setStatus("loading")
    const { data, error } = await supabase.auth.getUserIdentities()
    if (error) {
      setStatus("error")
      return
    }

    setStatus(
      data.identities.some((identity) => identity.provider === "google")
        ? "linked"
        : "unlinked"
    )
  }, [isActiveViewport, isConfigured, supabase])

  useEffect(() => {
    void loadConnectionStatus()
  }, [loadConnectionStatus])

  if (!isConfigured || !isActiveViewport) return null

  return (
    <section
      className="max-w-xl rounded-lg border p-4"
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Image
            src="/brand/google-g.png"
            alt=""
            width={48}
            height={48}
            className="-ml-3 -mt-3"
          />
          <h4 id={titleId} className="font-medium">
            Google
          </h4>
          <p className="text-muted-foreground mt-1 text-sm">
            Add Google as another way to sign in. This is not two-factor
            authentication.
          </p>
        </div>
        {status === "linked" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CircleCheckIcon className="size-4" aria-hidden />
            Connected
          </span>
        ) : null}
      </div>

      <div className="mt-4" aria-live="polite">
        {status === "loading" ? (
          <p
            className="text-muted-foreground flex items-center gap-2 text-sm"
            role="status"
          >
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
            Checking Google connection…
          </p>
        ) : null}

        {status === "linked" ? (
          <p className="text-muted-foreground text-sm">
            You can sign in with Google or your password.
          </p>
        ) : null}

        {status === "unlinked" ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Choose the Google account for {email || "your confirmed email"}.
            </p>
            <GoogleAuthPanel
              mode="link"
              redirectTo="/workspace"
              showDivider={false}
              onSuccess={() => setStatus("linked")}
            />
          </div>
        ) : null}

        {status === "error" ? (
          <div className="space-y-3">
            <p className="text-destructive text-sm" role="alert">
              Unable to check your Google connection.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadConnectionStatus()}
            >
              Try again
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
