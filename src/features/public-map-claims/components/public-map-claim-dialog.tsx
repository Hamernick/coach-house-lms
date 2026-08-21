"use client"

import { useMemo, useRef, useState, type FormEvent } from "react"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"

import type { PublicMapClaimTargetKind } from "../types"

export type PublicMapClaimListingOption = {
  id: string
  name: string
  targetKind: Exclude<PublicMapClaimTargetKind, "new">
}

type ClaimMode = "claim" | "new"

function createSubmissionKey() {
  return crypto.randomUUID()
}

export function PublicMapClaimDialog({
  listingOptions,
}: {
  listingOptions: PublicMapClaimListingOption[]
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ClaimMode>("claim")
  const [listingQuery, setListingQuery] = useState("")
  const [selectedListing, setSelectedListing] =
    useState<PublicMapClaimListingOption | null>(null)
  const [dirty, setDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submissionKeyRef = useRef(createSubmissionKey())

  const filteredListings = useMemo(() => {
    const query = listingQuery.trim().toLocaleLowerCase()
    if (!query) return []
    return listingOptions
      .filter((listing) => listing.name.toLocaleLowerCase().includes(query))
      .slice(0, 8)
  }, [listingOptions, listingQuery])

  function begin(nextMode: ClaimMode) {
    setMode(nextMode)
    setListingQuery("")
    setSelectedListing(null)
    setDirty(false)
    submissionKeyRef.current = createSubmissionKey()
    setOpen(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && dirty && !window.confirm("Discard this request?")) return
    setOpen(nextOpen)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    if (mode === "claim" && !selectedListing) {
      form.querySelector<HTMLInputElement>("#claim-listing-search")?.focus()
      return
    }

    const formData = new FormData(form)
    setSubmitting(true)
    try {
      const response = await fetch("/api/public/organization-claims", {
        body: JSON.stringify({
          claimantEmail: formData.get("claimantEmail"),
          claimantName: formData.get("claimantName"),
          listingName:
            selectedListing?.name ?? formData.get("listingName") ?? "",
          message: formData.get("message"),
          submissionKey: submissionKeyRef.current,
          targetId: selectedListing?.id ?? null,
          targetKind: selectedListing?.targetKind ?? "new",
          website: formData.get("website"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      if (!response.ok) {
        toast.error(result?.error ?? "Unable to send the request.", {
          closeButton: true,
        })
        return
      }

      setDirty(false)
      setOpen(false)
      form.reset()
      setSelectedListing(null)
      submissionKeyRef.current = createSubmissionKey()
      toast.success(
        "Request received. We’ll review the listing and contact you.",
        {
          closeButton: true,
          duration: Number.POSITIVE_INFINITY,
        }
      )
    } catch {
      toast.error("Unable to send the request.", { closeButton: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full flex-col gap-0.5 rounded-xl py-4 text-center"
          >
            <span className="text-muted-foreground text-sm">
              Have an NFP on Coach House?
            </span>
            <span className="flex items-center gap-1 text-sm font-medium">
              Claim or manage it
              <ArrowUpRightIcon aria-hidden className="size-3.5" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64">
          <DropdownMenuItem
            className="min-h-11"
            onSelect={() => begin("claim")}
          >
            <BuildingIcon aria-hidden />
            Claim an existing listing
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={() => begin("new")}>
            <PlusIcon aria-hidden />
            Add a missing nonprofit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[min(44rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "claim" ? "Claim a listing" : "Add a nonprofit"}
            </DialogTitle>
            <DialogDescription>
              Send a request for Coach House to review. This does not change
              ownership or public access automatically.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onChange={() => setDirty(true)}
            onSubmit={handleSubmit}
          >
            {mode === "claim" ? (
              <div className="grid gap-2">
                <Label htmlFor="claim-listing-search">Nonprofit</Label>
                <Input
                  id="claim-listing-search"
                  value={selectedListing?.name ?? listingQuery}
                  onChange={(event) => {
                    setSelectedListing(null)
                    setListingQuery(event.target.value)
                  }}
                  autoComplete="off"
                  placeholder="Search listings"
                  required
                />
                {filteredListings.length > 0 && !selectedListing ? (
                  <div className="bg-popover grid max-h-48 overflow-y-auto rounded-md border p-1 shadow-sm">
                    {filteredListings.map((listing) => (
                      <button
                        key={`${listing.targetKind}:${listing.id}`}
                        type="button"
                        className="hover:bg-accent focus-visible:bg-accent min-h-10 truncate rounded-sm px-2 text-left text-sm outline-none"
                        onClick={() => {
                          setSelectedListing(listing)
                          setListingQuery(listing.name)
                        }}
                      >
                        {listing.name}
                      </button>
                    ))}
                  </div>
                ) : null}
                {listingQuery.trim() && filteredListings.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No listing found. Close this form and choose Add a missing
                    nonprofit.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="claim-listing-name">Nonprofit name</Label>
                <Input
                  id="claim-listing-name"
                  name="listingName"
                  minLength={2}
                  maxLength={160}
                  autoComplete="organization"
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="claim-name">Your name</Label>
              <Input
                id="claim-name"
                name="claimantName"
                minLength={2}
                maxLength={120}
                autoComplete="name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="claim-email">Email</Label>
              <Input
                id="claim-email"
                name="claimantEmail"
                type="email"
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="claim-message">Message</Label>
              <Textarea
                id="claim-message"
                name="message"
                maxLength={2000}
                rows={4}
                placeholder="Tell us how you’re connected to this nonprofit."
              />
            </div>
            <div className="absolute -left-[10000px]" aria-hidden="true">
              <Label htmlFor="claim-website">Website</Label>
              <Input
                id="claim-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
