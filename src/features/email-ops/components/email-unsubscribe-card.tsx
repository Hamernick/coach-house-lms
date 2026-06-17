"use client"

import Link from "next/link"
import { useState } from "react"

import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EmailUnsubscribeCardProps = {
  token: string
  email: string
  topicLabel: string
}

type UnsubscribeState =
  | { status: "idle" }
  | { status: "pending"; scope: "topic" | "global" }
  | { status: "done"; scope: "topic" | "global" }
  | { status: "error"; message: string }

export function EmailUnsubscribeCard({
  token,
  email,
  topicLabel,
}: EmailUnsubscribeCardProps) {
  const [state, setState] = useState<UnsubscribeState>({ status: "idle" })

  async function unsubscribe(scope: "topic" | "global") {
    setState({ status: "pending", scope })
    const response = await fetch("/api/email/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, scope }),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => "")
      setState({
        status: "error",
        message: message || "We could not update your email preferences.",
      })
      return
    }

    setState({ status: "done", scope })
  }

  const pendingScope = state.status === "pending" ? state.scope : null
  const doneScope = state.status === "done" ? state.scope : null

  return (
    <section className="w-full max-w-md rounded-[1.35rem] border border-border/60 bg-background p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Email preferences</p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          Manage your emails
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Choose what {email} receives from Coach House. Account, billing, and
          security notices may still be sent when required.
        </p>
      </div>

      {doneScope ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2Icon className="size-4" aria-hidden />
            {doneScope === "global"
              ? "You are unsubscribed from marketing emails."
              : `You are unsubscribed from ${topicLabel}.`}
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <p className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-2">
        <Button
          type="button"
          className="h-11 rounded-full"
          disabled={Boolean(doneScope || pendingScope)}
          onClick={() => unsubscribe("topic")}
        >
          <Loader2Icon
            className={cn("hidden size-4 animate-spin", pendingScope === "topic" && "block")}
            aria-hidden
          />
          Unsubscribe from {topicLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-full"
          disabled={Boolean(doneScope || pendingScope)}
          onClick={() => unsubscribe("global")}
        >
          <Loader2Icon
            className={cn("hidden size-4 animate-spin", pendingScope === "global" && "block")}
            aria-hidden
          />
          Unsubscribe from all marketing
        </Button>
        <Button asChild variant="ghost" className="h-11 rounded-full">
          <Link href="/">Keep my preferences</Link>
        </Button>
      </div>
    </section>
  )
}
