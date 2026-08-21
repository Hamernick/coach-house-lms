import Link from "next/link"
import ClipboardCheckIcon from "lucide-react/dist/esm/icons/clipboard-check"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type {
  PublicMapClaimQueue,
  PublicMapClaimRequest,
  PublicMapClaimStatus,
} from "../types"

const statuses: PublicMapClaimStatus[] = [
  "new",
  "reviewing",
  "verified",
  "approved",
  "rejected",
  "spam",
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function statusVariant(status: PublicMapClaimStatus) {
  if (status === "approved" || status === "verified") return "default" as const
  if (status === "rejected" || status === "spam") return "destructive" as const
  return "outline" as const
}

function ClaimDetail({
  claim,
  retryDeliveryAction,
  updateStatusAction,
}: {
  claim: PublicMapClaimRequest
  retryDeliveryAction: (formData: FormData) => Promise<void>
  updateStatusAction: (formData: FormData) => Promise<void>
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(claim.status)}>{claim.status}</Badge>
          <Badge variant="outline">{claim.deliveryStatus}</Badge>
        </div>
        <CardTitle className="break-words">{claim.listingName}</CardTitle>
        <CardDescription>
          Received{" "}
          <time dateTime={claim.createdAt}>{formatDate(claim.createdAt)}</time>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="mt-1 font-medium break-words">
              {claim.claimantName}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium break-all">
              <a
                className="underline-offset-4 hover:underline"
                href={`mailto:${claim.claimantEmail}`}
              >
                {claim.claimantEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Request type</dt>
            <dd className="mt-1 font-medium">
              {claim.targetKind.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Task</dt>
            <dd className="mt-1 font-medium">
              {claim.taskId ? "Created" : "Not created"}
            </dd>
          </div>
        </dl>
        <div>
          <h3 className="text-sm font-medium">Message</h3>
          <p className="bg-muted/45 mt-2 rounded-md border p-3 text-sm leading-6 whitespace-pre-wrap">
            {claim.message || "No message provided."}
          </p>
        </div>
        {claim.deliveryError ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-sm">
            <p>{claim.deliveryError}</p>
            <form action={retryDeliveryAction} className="mt-3">
              <input type="hidden" name="claimId" value={claim.id} />
              <Button type="submit" variant="outline" className="h-11 sm:h-9">
                Retry task and notification
              </Button>
            </form>
          </div>
        ) : null}
        <form
          action={updateStatusAction}
          className="grid gap-2 border-t pt-4 sm:grid-cols-[1fr_auto]"
        >
          <input type="hidden" name="claimId" value={claim.id} />
          <label className="grid gap-2 text-sm font-medium">
            Review status
            <select
              name="status"
              defaultValue={claim.status}
              className="border-input bg-background h-11 rounded-md border px-3 text-sm sm:h-9"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="h-11 self-end sm:h-9">
            Save status
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function PublicMapClaimAdminPage({
  queue,
  selectedClaimId,
  retryDeliveryAction,
  updateStatusAction,
}: {
  queue: PublicMapClaimQueue
  selectedClaimId: string | null
  retryDeliveryAction: (formData: FormData) => Promise<void>
  updateStatusAction: (formData: FormData) => Promise<void>
}) {
  const selected =
    queue.claims.find((claim) => claim.id === selectedClaimId) ??
    queue.claims[0] ??
    null

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-5 md:px-6 md:py-6"
    >
      <header className="border-border/70 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
            <ClipboardCheckIcon className="size-4" aria-hidden />
            Public intake
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Claim requests
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Verify identity before changing organization access or publication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{queue.total} total</Badge>
          <Link
            href="/admin/platform/resource-map"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-11 sm:h-8"
            )}
          >
            Resource review
          </Link>
        </div>
      </header>

      {queue.claims.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No claim requests</CardTitle>
            <CardDescription>
              New public submissions will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="bg-card max-h-[calc(100vh-8rem)] overflow-y-auto rounded-md border p-2 lg:sticky lg:top-4">
            <ol className="grid gap-2">
              {queue.claims.map((claim) => (
                <li key={claim.id}>
                  <Link
                    href={`/admin/platform/resource-map?view=claims&claim=${encodeURIComponent(claim.id)}`}
                    aria-current={
                      selected?.id === claim.id ? "page" : undefined
                    }
                    className={cn(
                      "hover:bg-muted/45 focus-visible:ring-ring flex min-h-11 items-start justify-between gap-2 rounded-md border px-3 py-2 outline-none focus-visible:ring-2",
                      selected?.id === claim.id && "bg-muted/65"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {claim.listingName}
                      </span>
                      <time
                        className="text-muted-foreground mt-1 block text-xs"
                        dateTime={claim.createdAt}
                      >
                        {formatDate(claim.createdAt)}
                      </time>
                    </span>
                    <Badge
                      variant={statusVariant(claim.status)}
                      className="shrink-0"
                    >
                      {claim.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
          {selected ? (
            <ClaimDetail
              claim={selected}
              retryDeliveryAction={retryDeliveryAction}
              updateStatusAction={updateStatusAction}
            />
          ) : null}
        </div>
      )}
    </main>
  )
}
