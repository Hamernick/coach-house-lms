"use client"

import Link from "next/link"
import { useActionState, useEffect, useState, type ReactNode } from "react"

import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FormAction = (formData: FormData) => Promise<void>

type ActionState = {
  status: "idle" | "success" | "error"
  message: string
  submittedAction: string | null
}

const INITIAL_STATE: ActionState = {
  status: "idle",
  message: "",
  submittedAction: null,
}

function useUnsavedReviewWarning(dirty: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
}

function useReviewAction(action: FormAction, successMessage: string) {
  const [state, submit, pending] = useActionState(
    async (
      _previous: ActionState,
      formData: FormData
    ): Promise<ActionState> => {
      const submittedAction =
        String(formData.get("status") ?? formData.get("isPublic") ?? "") || null
      try {
        await action(formData)
        return {
          status: "success",
          message: successMessage,
          submittedAction,
        }
      } catch (error) {
        return {
          status: "error",
          message: error instanceof Error ? error.message : "Update failed.",
          submittedAction,
        }
      }
    },
    INITIAL_STATE
  )
  return { state, submit, pending }
}

function PendingIcon() {
  return (
    <LoaderCircleIcon
      className="size-4 animate-spin motion-reduce:animate-none"
      aria-hidden
    />
  )
}

export function ResourceMapReviewDecisionForm({
  action,
  importRecordId,
  approvalBlocked,
}: {
  action: FormAction
  importRecordId: string
  approvalBlocked: boolean
}) {
  const [dirty, setDirty] = useState(false)
  const { state, submit, pending } = useReviewAction(
    action,
    "Review decision saved"
  )
  useUnsavedReviewWarning(dirty && !pending && state.status !== "success")

  return (
    <form
      action={submit}
      className="grid gap-3"
      onInput={() => setDirty(true)}
      data-resource-map-review-dirty={
        dirty && !pending && state.status !== "success" ? "true" : undefined
      }
    >
      <input type="hidden" name="importRecordId" value={importRecordId} />
      <div className="grid gap-1.5">
        <Label htmlFor={`review-reason-${importRecordId}`}>Audit Reason</Label>
        <Textarea
          id={`review-reason-${importRecordId}`}
          name="reason"
          placeholder="Explain evidence reviewed or why this record is blocked…"
          className="min-h-24"
        />
        <p className="text-muted-foreground text-xs leading-5">
          Required for rejection and stale decisions. Approval records the
          current administrator as reviewer.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="submit"
          name="status"
          value="approved"
          className="h-11 sm:h-9"
          disabled={pending || approvalBlocked}
          title={
            approvalBlocked
              ? "Resolve all completeness and verification blockers before approval."
              : undefined
          }
        >
          {pending && state.submittedAction === "approved" ? (
            <PendingIcon />
          ) : null}
          Approve Record
        </Button>
        <Button
          type="submit"
          name="status"
          value="rejected"
          variant="destructive"
          className="h-11 sm:h-9"
          disabled={pending}
        >
          {pending && state.submittedAction === "rejected" ? (
            <PendingIcon />
          ) : null}
          Reject Record
        </Button>
        <Button
          type="submit"
          name="status"
          value="stale"
          variant="outline"
          className="h-11 sm:h-9"
          disabled={pending}
        >
          {pending && state.submittedAction === "stale" ? (
            <PendingIcon />
          ) : null}
          Mark Stale
        </Button>
      </div>
      <p
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-destructive text-sm"
            : "text-muted-foreground text-sm"
        }
      >
        {state.message}
      </p>
    </form>
  )
}

export function ResourceMapVisibilityDecisionForm({
  action,
  id,
  kind,
}: {
  action: FormAction
  id: string
  kind: "contact" | "link"
}) {
  const [dirty, setDirty] = useState(false)
  const { state, submit, pending } = useReviewAction(
    action,
    `${kind === "contact" ? "Contact" : "Link"} visibility saved`
  )
  useUnsavedReviewWarning(dirty && !pending && state.status !== "success")

  return (
    <form
      action={submit}
      className="grid gap-2"
      onInput={() => setDirty(true)}
      data-resource-map-review-dirty={
        dirty && !pending && state.status !== "success" ? "true" : undefined
      }
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <Label htmlFor={`visibility-reason-${id}`}>Visibility Reason</Label>
      <Input
        id={`visibility-reason-${id}`}
        name="reason"
        required
        placeholder="Explain the public/private decision…"
        className="h-11 text-base sm:h-9 sm:text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="submit"
          name="isPublic"
          value="true"
          className="h-11 sm:h-9"
          disabled={pending}
        >
          {pending && state.submittedAction === "true" ? <PendingIcon /> : null}
          Make Public
        </Button>
        <Button
          type="submit"
          name="isPublic"
          value="false"
          variant="outline"
          className="h-11 sm:h-9"
          disabled={pending}
        >
          {pending && state.submittedAction === "false" ? (
            <PendingIcon />
          ) : null}
          Keep Private
        </Button>
      </div>
      <p
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-destructive text-sm"
            : "text-muted-foreground text-sm"
        }
      >
        {state.message}
      </p>
    </form>
  )
}

export function ResourceMapReviewLink({
  href,
  children,
  className,
  current,
}: {
  href: string
  children: ReactNode
  className?: string
  current?: boolean
}) {
  return (
    <Link
      href={href}
      className={className}
      aria-current={current ? "page" : undefined}
      onNavigate={(event) => {
        if (
          document.querySelector('[data-resource-map-review-dirty="true"]') &&
          !window.confirm("Discard the unsaved audit reason?")
        ) {
          event.preventDefault()
        }
      }}
    >
      {children}
    </Link>
  )
}
